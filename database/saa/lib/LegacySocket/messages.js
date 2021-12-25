"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const WABinary_1 = require("../WABinary");
const boom_1 = require("@hapi/boom");
const Types_1 = require("../Types");
const Utils_1 = require("../Utils");
const chats_1 = __importDefault(require("./chats"));
const Defaults_1 = require("../Defaults");
const WAProto_1 = require("../../WAProto");
const STATUS_MAP = {
    read: Types_1.WAMessageStatus.READ,
    message: Types_1.WAMessageStatus.DELIVERY_ACK,
    error: Types_1.WAMessageStatus.ERROR
};
const makeMessagesSocket = (config) => {
    const { logger } = config;
    const sock = (0, chats_1.default)(config);
    const { ev, ws: socketEvents, query, generateMessageTag, currentEpoch, setQuery, state } = sock;
    let mediaConn;
    const refreshMediaConn = async (forceGet = false) => {
        let media = await mediaConn;
        if (!media || forceGet || (new Date().getTime() - media.fetchDate.getTime()) > media.ttl * 1000) {
            mediaConn = (async () => {
                const { media_conn } = await query({
                    json: ['query', 'mediaConn'],
                    requiresPhoneConnection: false,
                    expect200: true
                });
                media_conn.fetchDate = new Date();
                return media_conn;
            })();
        }
        return mediaConn;
    };
    const fetchMessagesFromWA = async (jid, count, cursor) => {
        let key;
        if (cursor) {
            key = 'before' in cursor ? cursor.before : cursor.after;
        }
        const { content } = await query({
            json: {
                tag: 'query',
                attrs: {
                    epoch: currentEpoch().toString(),
                    type: 'message',
                    jid: jid,
                    kind: !cursor || 'before' in cursor ? 'before' : 'after',
                    count: count.toString(),
                    index: key === null || key === void 0 ? void 0 : key.id,
                    owner: (key === null || key === void 0 ? void 0 : key.fromMe) === false ? 'false' : 'true',
                }
            },
            binaryTag: [Types_1.WAMetric.queryMessages, Types_1.WAFlag.ignore],
            expect200: false,
            requiresPhoneConnection: true
        });
        if (Array.isArray(content)) {
            return content.map(data => WAProto_1.proto.WebMessageInfo.decode(data.content));
        }
        return [];
    };
    const updateMediaMessage = async (message) => {
        var _a, _b, _c, _d, _e;
        const content = ((_a = message.message) === null || _a === void 0 ? void 0 : _a.audioMessage) || ((_b = message.message) === null || _b === void 0 ? void 0 : _b.videoMessage) || ((_c = message.message) === null || _c === void 0 ? void 0 : _c.imageMessage) || ((_d = message.message) === null || _d === void 0 ? void 0 : _d.stickerMessage) || ((_e = message.message) === null || _e === void 0 ? void 0 : _e.documentMessage);
        if (!content)
            throw new boom_1.Boom(`given message ${message.key.id} is not a media message`, { statusCode: 400, data: message });
        const response = await query({
            json: {
                tag: 'query',
                attrs: {
                    type: 'media',
                    index: message.key.id,
                    owner: message.key.fromMe ? 'true' : 'false',
                    jid: message.key.remoteJid,
                    epoch: currentEpoch().toString()
                }
            },
            binaryTag: [Types_1.WAMetric.queryMedia, Types_1.WAFlag.ignore],
            expect200: true,
            requiresPhoneConnection: true
        });
        const attrs = response.attrs;
        Object.assign(content, attrs); // update message
        ev.emit('messages.upsert', { messages: [message], type: 'replace' });
        return response;
    };
    const onMessage = (message, type) => {
        var _a, _b, _c, _d;
        const jid = message.key.remoteJid;
        // store chat updates in this
        const chatUpdate = {
            id: jid,
        };
        const emitGroupUpdate = (update) => {
            ev.emit('groups.update', [{ id: jid, ...update }]);
        };
        if (message.message) {
            chatUpdate.conversationTimestamp = +(0, Utils_1.toNumber)(message.messageTimestamp);
            // add to count if the message isn't from me & there exists a message
            if (!message.key.fromMe) {
                chatUpdate.unreadCount = 1;
                const participant = (0, WABinary_1.jidNormalizedUser)(message.participant || jid);
                ev.emit('presence.update', {
                    id: jid,
                    presences: { [participant]: { lastKnownPresence: 'available' } }
                });
            }
        }
        const protocolMessage = ((_a = message.message) === null || _a === void 0 ? void 0 : _a.protocolMessage) || ((_d = (_c = (_b = message.message) === null || _b === void 0 ? void 0 : _b.ephemeralMessage) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.protocolMessage);
        // if it's a message to delete another message
        if (protocolMessage) {
            switch (protocolMessage.type) {
                case WAProto_1.proto.ProtocolMessage.ProtocolMessageType.REVOKE:
                    const key = protocolMessage.key;
                    const messageStubType = Types_1.WAMessageStubType.REVOKE;
                    ev.emit('messages.update', [
                        {
                            // the key of the deleted message is updated
                            update: { message: null, key: message.key, messageStubType },
                            key
                        }
                    ]);
                    return;
                case WAProto_1.proto.ProtocolMessage.ProtocolMessageType.EPHEMERAL_SETTING:
                    chatUpdate.ephemeralSettingTimestamp = message.messageTimestamp;
                    chatUpdate.ephemeralExpiration = protocolMessage.ephemeralExpiration;
                    if ((0, WABinary_1.isJidGroup)(jid)) {
                        emitGroupUpdate({ ephemeralDuration: protocolMessage.ephemeralExpiration || null });
                    }
                    break;
                default:
                    break;
            }
        }
        // check if the message is an action 
        if (message.messageStubType) {
            const { user } = state.legacy;
            //let actor = jidNormalizedUser (message.participant)
            let participants;
            const emitParticipantsUpdate = (action) => (ev.emit('group-participants.update', { id: jid, participants, action }));
            switch (message.messageStubType) {
                case Types_1.WAMessageStubType.CHANGE_EPHEMERAL_SETTING:
                    chatUpdate.ephemeralSettingTimestamp = message.messageTimestamp;
                    chatUpdate.ephemeralExpiration = +message.messageStubParameters[0];
                    if ((0, WABinary_1.isJidGroup)(jid)) {
                        emitGroupUpdate({ ephemeralDuration: +message.messageStubParameters[0] || null });
                    }
                    break;
                case Types_1.WAMessageStubType.GROUP_PARTICIPANT_LEAVE:
                case Types_1.WAMessageStubType.GROUP_PARTICIPANT_REMOVE:
                    participants = message.messageStubParameters.map(WABinary_1.jidNormalizedUser);
                    emitParticipantsUpdate('remove');
                    // mark the chat read only if you left the group
                    if (participants.includes(user.id)) {
                        chatUpdate.readOnly = true;
                    }
                    break;
                case Types_1.WAMessageStubType.GROUP_PARTICIPANT_ADD:
                case Types_1.WAMessageStubType.GROUP_PARTICIPANT_INVITE:
                case Types_1.WAMessageStubType.GROUP_PARTICIPANT_ADD_REQUEST_JOIN:
                    participants = message.messageStubParameters.map(WABinary_1.jidNormalizedUser);
                    if (participants.includes(user.id)) {
                        chatUpdate.readOnly = null;
                    }
                    emitParticipantsUpdate('add');
                    break;
                case Types_1.WAMessageStubType.GROUP_CHANGE_ANNOUNCE:
                    const announce = message.messageStubParameters[0] === 'on';
                    emitGroupUpdate({ announce });
                    break;
                case Types_1.WAMessageStubType.GROUP_CHANGE_RESTRICT:
                    const restrict = message.messageStubParameters[0] === 'on';
                    emitGroupUpdate({ restrict });
                    break;
                case Types_1.WAMessageStubType.GROUP_CHANGE_SUBJECT:
                case Types_1.WAMessageStubType.GROUP_CREATE:
                    chatUpdate.name = message.messageStubParameters[0];
                    emitGroupUpdate({ subject: chatUpdate.name });
                    break;
            }
        }
        if (Object.keys(chatUpdate).length > 1) {
            ev.emit('chats.update', [chatUpdate]);
        }
        ev.emit('messages.upsert', { messages: [message], type });
    };
    const waUploadToServer = (0, Utils_1.getWAUploadToServer)(config, refreshMediaConn);
    /** Query a string to check if it has a url, if it does, return WAUrlInfo */
    const generateUrlInfo = async (text) => {
        const response = await query({
            json: {
                tag: 'query',
                attrs: {
                    type: 'url',
                    url: text,
                    epoch: currentEpoch().toString()
                }
            },
            binaryTag: [26, Types_1.WAFlag.ignore],
            expect200: true,
            requiresPhoneConnection: false
        });
        const urlInfo = { ...response.attrs };
        if (response && response.content) {
            urlInfo.jpegThumbnail = response.content;
        }
        return urlInfo;
    };
    /** Relay (send) a WAMessage; more advanced functionality to send a built WA Message, you may want to stick with sendMessage() */
    const relayMessage = async (message, { waitForAck } = { waitForAck: true }) => {
        var _a;
        const json = {
            tag: 'action',
            attrs: { epoch: currentEpoch().toString(), type: 'relay' },
            content: [
                {
                    tag: 'message',
                    attrs: {},
                    content: WAProto_1.proto.WebMessageInfo.encode(message).finish()
                }
            ]
        };
        const isMsgToMe = (0, WABinary_1.areJidsSameUser)(message.key.remoteJid, ((_a = state.legacy.user) === null || _a === void 0 ? void 0 : _a.id) || '');
        const flag = isMsgToMe ? Types_1.WAFlag.acknowledge : Types_1.WAFlag.ignore; // acknowledge when sending message to oneself
        const mID = message.key.id;
        const finalState = isMsgToMe ? Types_1.WAMessageStatus.READ : Types_1.WAMessageStatus.SERVER_ACK;
        message.status = Types_1.WAMessageStatus.PENDING;
        const promise = query({
            json,
            binaryTag: [Types_1.WAMetric.message, flag],
            tag: mID,
            expect200: true,
            requiresPhoneConnection: true
        });
        if (waitForAck) {
            await promise;
            message.status = finalState;
        }
        else {
            const emitUpdate = (status) => {
                message.status = status;
                ev.emit('messages.update', [{ key: message.key, update: { status } }]);
            };
            promise
                .then(() => emitUpdate(finalState))
                .catch(() => emitUpdate(Types_1.WAMessageStatus.ERROR));
        }
        if (config.emitOwnEvents) {
            onMessage(message, 'append');
        }
    };
    // messages received
    const messagesUpdate = (node, type) => {
        const messages = (0, WABinary_1.getBinaryNodeMessages)(node);
        messages.reverse();
        ev.emit('messages.upsert', { messages, type });
    };
    socketEvents.on('CB:action,add:last', json => messagesUpdate(json, 'last'));
    socketEvents.on('CB:action,add:unread', json => messagesUpdate(json, 'prepend'));
    socketEvents.on('CB:action,add:before', json => messagesUpdate(json, 'prepend'));
    // new messages
    socketEvents.on('CB:action,add:relay,message', (node) => {
        const msgs = (0, WABinary_1.getBinaryNodeMessages)(node);
        for (const msg of msgs) {
            onMessage(msg, 'notify');
        }
    });
    // If a message has been updated 
    // usually called when a video message gets its upload url, or live locations or ciphertext message gets fixed
    socketEvents.on('CB:action,add:update,message', (node) => {
        const msgs = (0, WABinary_1.getBinaryNodeMessages)(node);
        for (const msg of msgs) {
            onMessage(msg, 'replace');
        }
    });
    // message status updates
    const onMessageStatusUpdate = ({ content }) => {
        if (Array.isArray(content)) {
            const updates = [];
            for (const { attrs: json } of content) {
                const key = {
                    remoteJid: (0, WABinary_1.jidNormalizedUser)(json.jid),
                    id: json.index,
                    fromMe: json.owner === 'true'
                };
                const status = STATUS_MAP[json.type];
                if (status) {
                    updates.push({ key, update: { status } });
                }
                else {
                    logger.warn({ content, key }, 'got unknown status update for message');
                }
            }
            ev.emit('messages.update', updates);
        }
    };
    const onMessageInfoUpdate = ([, attributes]) => {
        var _a, _b;
        let ids = attributes.id;
        if (typeof ids === 'string') {
            ids = [ids];
        }
        let updateKey;
        switch (attributes.ack.toString()) {
            case '2':
                updateKey = 'deliveries';
                break;
            case '3':
                updateKey = 'reads';
                break;
            default:
                logger.warn({ attributes }, `received unknown message info update`);
                return;
        }
        const keyPartial = {
            remoteJid: (0, WABinary_1.jidNormalizedUser)(attributes.to),
            fromMe: (0, WABinary_1.areJidsSameUser)(attributes.from, ((_b = (_a = state.legacy) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.id) || ''),
        };
        const updates = ids.map(id => ({
            key: { ...keyPartial, id },
            update: {
                [updateKey]: { [(0, WABinary_1.jidNormalizedUser)(attributes.participant || attributes.to)]: new Date(+attributes.t) }
            }
        }));
        ev.emit('message-info.update', updates);
        // for individual messages
        // it means the message is marked read/delivered
        if (!(0, WABinary_1.isJidGroup)(keyPartial.remoteJid)) {
            ev.emit('messages.update', ids.map(id => ({
                key: { ...keyPartial, id },
                update: {
                    status: updateKey === 'deliveries' ? Types_1.WAMessageStatus.DELIVERY_ACK : Types_1.WAMessageStatus.READ
                }
            })));
        }
    };
    socketEvents.on('CB:action,add:relay,received', onMessageStatusUpdate);
    socketEvents.on('CB:action,,received', onMessageStatusUpdate);
    socketEvents.on('CB:Msg', onMessageInfoUpdate);
    socketEvents.on('CB:MsgInfo', onMessageInfoUpdate);
    return {
        ...sock,
        relayMessage,
        generateUrlInfo,
        messageInfo: async (jid, messageID) => {
            const { content } = await query({
                json: {
                    tag: 'query',
                    attrs: {
                        type: 'message_info',
                        index: messageID,
                        jid: jid,
                        epoch: currentEpoch().toString()
                    }
                },
                binaryTag: [Types_1.WAMetric.queryRead, Types_1.WAFlag.ignore],
                expect200: true,
                requiresPhoneConnection: true
            });
            const info = { reads: {}, deliveries: {} };
            if (Array.isArray(content)) {
                for (const { tag, content: innerData } of content) {
                    const [{ attrs }] = innerData;
                    const jid = (0, WABinary_1.jidNormalizedUser)(attrs.jid);
                    const date = new Date(+attrs.t * 1000);
                    switch (tag) {
                        case 'read':
                            info.reads[jid] = date;
                            break;
                        case 'delivery':
                            info.deliveries[jid] = date;
                            break;
                    }
                }
            }
            return info;
        },
        downloadMediaMessage: async (message, type = 'buffer') => {
            const downloadMediaMessage = async () => {
                let mContent = (0, Utils_1.extractMessageContent)(message.message);
                if (!mContent)
                    throw new boom_1.Boom('No message present', { statusCode: 400, data: message });
                const stream = await (0, Utils_1.decryptMediaMessageBuffer)(mContent);
                if (type === 'buffer') {
                    let buffer = Buffer.from([]);
                    for await (const chunk of stream) {
                        buffer = Buffer.concat([buffer, chunk]);
                    }
                    return buffer;
                }
                return stream;
            };
            try {
                const result = await downloadMediaMessage();
                return result;
            }
            catch (error) {
                if (error.message.includes('404')) { // media needs to be updated
                    logger.info(`updating media of message: ${message.key.id}`);
                    await updateMediaMessage(message);
                    const result = await downloadMediaMessage();
                    return result;
                }
                throw error;
            }
        },
        updateMediaMessage,
        fetchMessagesFromWA,
        /** Load a single message specified by the ID */
        loadMessageFromWA: async (jid, id) => {
            let message;
            // load the message before the given message
            let messages = (await fetchMessagesFromWA(jid, 1, { before: { id, fromMe: true } }));
            if (!messages[0])
                messages = (await fetchMessagesFromWA(jid, 1, { before: { id, fromMe: false } }));
            // the message after the loaded message is the message required
            const [actual] = await fetchMessagesFromWA(jid, 1, { after: messages[0] && messages[0].key });
            message = actual;
            return message;
        },
        searchMessages: async (txt, inJid, count, page) => {
            var _a;
            const node = await query({
                json: {
                    tag: 'query',
                    attrs: {
                        epoch: currentEpoch().toString(),
                        type: 'search',
                        search: txt,
                        count: count.toString(),
                        page: page.toString(),
                        jid: inJid
                    }
                },
                binaryTag: [24, Types_1.WAFlag.ignore],
                expect200: true
            }); // encrypt and send  off
            return {
                last: ((_a = node.attrs) === null || _a === void 0 ? void 0 : _a.last) === 'true',
                messages: (0, WABinary_1.getBinaryNodeMessages)(node)
            };
        },
        sendMessage: async (jid, content, options = { waitForAck: true }) => {
            var _a;
            const userJid = (_a = state.legacy.user) === null || _a === void 0 ? void 0 : _a.id;
            if (typeof content === 'object' &&
                'disappearingMessagesInChat' in content &&
                typeof content['disappearingMessagesInChat'] !== 'undefined' &&
                (0, WABinary_1.isJidGroup)(jid)) {
                const { disappearingMessagesInChat } = content;
                const value = typeof disappearingMessagesInChat === 'boolean' ?
                    (disappearingMessagesInChat ? Defaults_1.WA_DEFAULT_EPHEMERAL : 0) :
                    disappearingMessagesInChat;
                const tag = generateMessageTag(true);
                await setQuery([
                    {
                        tag: 'group',
                        attrs: { id: tag, jid, type: 'prop', author: userJid },
                        content: [
                            { tag: 'ephemeral', attrs: { value: value.toString() } }
                        ]
                    }
                ]);
            }
            else {
                const msg = await (0, Utils_1.generateWAMessage)(jid, content, {
                    logger,
                    userJid: userJid,
                    getUrlInfo: generateUrlInfo,
                    upload: waUploadToServer,
                    mediaCache: config.mediaCache,
                    ...options,
                });
                await relayMessage(msg, { waitForAck: options.waitForAck });
                return msg;
            }
        }
    };
};
exports.default = makeMessagesSocket;
