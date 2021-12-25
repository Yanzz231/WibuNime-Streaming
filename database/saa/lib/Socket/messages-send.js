"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeMessagesSocket = void 0;
const Utils_1 = require("../Utils");
const WABinary_1 = require("../WABinary");
const WAProto_1 = require("../../WAProto");
const Defaults_1 = require("../Defaults");
const groups_1 = require("./groups");
const node_cache_1 = __importDefault(require("node-cache"));
const makeMessagesSocket = (config) => {
    const { logger } = config;
    const sock = (0, groups_1.makeGroupsSocket)(config);
    const { ev, authState, query, generateMessageTag, sendNode, groupMetadata, groupToggleEphemeral } = sock;
    const userDevicesCache = config.userDevicesCache || new node_cache_1.default({
        stdTTL: 300,
        useClones: false
    });
    let privacySettings;
    const fetchPrivacySettings = async (force = false) => {
        if (!privacySettings || force) {
            const { content } = await query({
                tag: 'iq',
                attrs: {
                    xmlns: 'privacy',
                    to: WABinary_1.S_WHATSAPP_NET,
                    type: 'get'
                },
                content: [
                    { tag: 'privacy', attrs: {} }
                ]
            });
            privacySettings = (0, WABinary_1.reduceBinaryNodeToDictionary)(content[0], 'category');
        }
        return privacySettings;
    };
    let mediaConn;
    const refreshMediaConn = async (forceGet = false) => {
        let media = await mediaConn;
        if (!media || forceGet || (new Date().getTime() - media.fetchDate.getTime()) > media.ttl * 1000) {
            mediaConn = (async () => {
                const result = await query({
                    tag: 'iq',
                    attrs: {
                        type: 'set',
                        xmlns: 'w:m',
                        to: WABinary_1.S_WHATSAPP_NET,
                    },
                    content: [{ tag: 'media_conn', attrs: {} }]
                });
                const mediaConnNode = (0, WABinary_1.getBinaryNodeChild)(result, 'media_conn');
                const node = {
                    hosts: (0, WABinary_1.getBinaryNodeChildren)(mediaConnNode, 'host').map(item => item.attrs),
                    auth: mediaConnNode.attrs.auth,
                    ttl: +mediaConnNode.attrs.ttl,
                    fetchDate: new Date()
                };
                logger.debug('fetched media conn');
                return node;
            })();
        }
        return mediaConn;
    };
    const sendReceipt = async (jid, participant, messageIds, type) => {
        const node = {
            tag: 'receipt',
            attrs: {
                id: messageIds[0],
                t: Date.now().toString(),
                to: jid,
            },
        };
        if (type) {
            node.attrs.type = type;
        }
        if (participant) {
            node.attrs.participant = participant;
        }
        const remainingMessageIds = messageIds.slice(1);
        if (remainingMessageIds.length) {
            node.content = [
                {
                    tag: 'list',
                    attrs: {},
                    content: remainingMessageIds.map(id => ({
                        tag: 'item',
                        attrs: { id }
                    }))
                }
            ];
        }
        logger.debug({ jid, messageIds }, 'reading messages');
        await sendNode(node);
    };
    const sendDeliveryReceipt = (jid, participant, messageIds) => {
        return sendReceipt(jid, participant, messageIds, undefined);
    };
    const sendReadReceipt = async (jid, participant, messageIds) => {
        const privacySettings = await fetchPrivacySettings();
        // based on privacy settings, we have to change the read type
        const readType = privacySettings.readreceipts === 'all' ? 'read' : 'read-self';
        return sendReceipt(jid, participant, messageIds, readType);
    };
    const getUSyncDevices = async (jids, ignoreZeroDevices) => {
        const deviceResults = [];
        const users = [];
        jids = Array.from(new Set(jids));
        for (let jid of jids) {
            const user = (0, WABinary_1.jidDecode)(jid).user;
            jid = (0, WABinary_1.jidNormalizedUser)(jid);
            if (userDevicesCache.has(user)) {
                const devices = userDevicesCache.get(user);
                deviceResults.push(...devices);
                logger.trace({ user }, 'using cache for devices');
            }
            else {
                users.push({ tag: 'user', attrs: { jid } });
            }
        }
        const iq = {
            tag: 'iq',
            attrs: {
                to: WABinary_1.S_WHATSAPP_NET,
                type: 'get',
                xmlns: 'usync',
            },
            content: [
                {
                    tag: 'usync',
                    attrs: {
                        sid: generateMessageTag(),
                        mode: 'query',
                        last: 'true',
                        index: '0',
                        context: 'message',
                    },
                    content: [
                        {
                            tag: 'query',
                            attrs: {},
                            content: [
                                {
                                    tag: 'devices',
                                    attrs: { version: '2' }
                                }
                            ]
                        },
                        { tag: 'list', attrs: {}, content: users }
                    ]
                },
            ],
        };
        const result = await query(iq);
        const extracted = (0, Utils_1.extractDeviceJids)(result, authState.creds.me.id, ignoreZeroDevices);
        const deviceMap = {};
        for (const item of extracted) {
            deviceMap[item.user] = deviceMap[item.user] || [];
            deviceMap[item.user].push(item);
            deviceResults.push(item);
        }
        for (const key in deviceMap) {
            userDevicesCache.set(key, deviceMap[key]);
        }
        return deviceResults;
    };
    const assertSessions = async (jids, force) => {
        let jidsRequiringFetch = [];
        if (force) {
            jidsRequiringFetch = jids;
        }
        else {
            const addrs = jids.map(jid => (0, Utils_1.jidToSignalProtocolAddress)(jid).toString());
            const sessions = await authState.keys.get('session', addrs);
            for (const jid of jids) {
                const signalId = (0, Utils_1.jidToSignalProtocolAddress)(jid).toString();
                if (!sessions[signalId]) {
                    jidsRequiringFetch.push(jid);
                }
            }
        }
        if (jidsRequiringFetch.length) {
            logger.debug({ jidsRequiringFetch }, `fetching sessions`);
            const result = await query({
                tag: 'iq',
                attrs: {
                    xmlns: 'encrypt',
                    type: 'get',
                    to: WABinary_1.S_WHATSAPP_NET,
                },
                content: [
                    {
                        tag: 'key',
                        attrs: {},
                        content: jidsRequiringFetch.map(jid => ({
                            tag: 'user',
                            attrs: { jid, reason: 'identity' },
                        }))
                    }
                ]
            });
            await (0, Utils_1.parseAndInjectE2ESessions)(result, authState);
            return true;
        }
        return false;
    };
    const createParticipantNodes = async (jids, bytes) => {
        await assertSessions(jids, false);
        if (authState.keys.isInTransaction()) {
            await authState.keys.prefetch('session', jids.map(jid => (0, Utils_1.jidToSignalProtocolAddress)(jid).toString()));
        }
        const nodes = await Promise.all(jids.map(async (jid) => {
            const { type, ciphertext } = await (0, Utils_1.encryptSignalProto)(jid, bytes, authState);
            const node = {
                tag: 'to',
                attrs: { jid },
                content: [{
                        tag: 'enc',
                        attrs: { v: '2', type },
                        content: ciphertext
                    }]
            };
            return node;
        }));
        return nodes;
    };
    const relayMessage = async (jid, message, { messageId: msgId, participant, additionalAttributes, cachedGroupMetadata }) => {
        const meId = authState.creds.me.id;
        const { user, server } = (0, WABinary_1.jidDecode)(jid);
        const isGroup = server === 'g.us';
        msgId = msgId || (0, Utils_1.generateMessageID)();
        const encodedMsg = (0, Utils_1.encodeWAMessage)(message);
        const participants = [];
        const destinationJid = (0, WABinary_1.jidEncode)(user, isGroup ? 'g.us' : 's.whatsapp.net');
        const binaryNodeContent = [];
        const devices = [];
        if (participant) {
            const { user, device } = (0, WABinary_1.jidDecode)(participant);
            devices.push({ user, device });
        }
        await authState.keys.transaction(async () => {
            if (isGroup) {
                const { ciphertext, senderKeyDistributionMessageKey } = await (0, Utils_1.encryptSenderKeyMsgSignalProto)(destinationJid, encodedMsg, meId, authState);
                const [groupData, senderKeyMap] = await Promise.all([
                    (async () => {
                        let groupData = cachedGroupMetadata ? await cachedGroupMetadata(jid) : undefined;
                        if (!groupData)
                            groupData = await groupMetadata(jid);
                        return groupData;
                    })(),
                    (async () => {
                        const result = await authState.keys.get('sender-key-memory', [jid]);
                        return result[jid] || {};
                    })()
                ]);
                if (!participant) {
                    const participantsList = groupData.participants.map(p => p.id);
                    const additionalDevices = await getUSyncDevices(participantsList, false);
                    devices.push(...additionalDevices);
                }
                const senderKeyJids = [];
                // ensure a connection is established with every device
                for (const { user, device } of devices) {
                    const jid = (0, WABinary_1.jidEncode)(user, 's.whatsapp.net', device);
                    if (!senderKeyMap[jid]) {
                        senderKeyJids.push(jid);
                        // store that this person has had the sender keys sent to them
                        senderKeyMap[jid] = true;
                    }
                }
                // if there are some participants with whom the session has not been established
                // if there are, we re-send the senderkey
                if (senderKeyJids.length) {
                    logger.debug({ senderKeyJids }, 'sending new sender key');
                    const encSenderKeyMsg = (0, Utils_1.encodeWAMessage)({
                        senderKeyDistributionMessage: {
                            axolotlSenderKeyDistributionMessage: senderKeyDistributionMessageKey,
                            groupId: destinationJid
                        }
                    });
                    participants.push(...(await createParticipantNodes(senderKeyJids, encSenderKeyMsg)));
                }
                binaryNodeContent.push({
                    tag: 'enc',
                    attrs: { v: '2', type: 'skmsg' },
                    content: ciphertext
                });
                await authState.keys.set({ 'sender-key-memory': { [jid]: senderKeyMap } });
            }
            else {
                const { user: meUser } = (0, WABinary_1.jidDecode)(meId);
                const encodedMeMsg = (0, Utils_1.encodeWAMessage)({
                    deviceSentMessage: {
                        destinationJid,
                        message
                    }
                });
                if (!participant) {
                    devices.push({ user });
                    devices.push({ user: meUser });
                    const additionalDevices = await getUSyncDevices([meId, jid], true);
                    devices.push(...additionalDevices);
                }
                const meJids = [];
                const otherJids = [];
                for (const { user, device } of devices) {
                    const jid = (0, WABinary_1.jidEncode)(user, 's.whatsapp.net', device);
                    const isMe = user === meUser;
                    if (isMe)
                        meJids.push(jid);
                    else
                        otherJids.push(jid);
                }
                const [meNodes, otherNodes] = await Promise.all([
                    createParticipantNodes(meJids, encodedMeMsg),
                    createParticipantNodes(otherJids, encodedMsg)
                ]);
                participants.push(...meNodes);
                participants.push(...otherNodes);
            }
            if (participants.length) {
                binaryNodeContent.push({
                    tag: 'participants',
                    attrs: {},
                    content: participants
                });
            }
            const stanza = {
                tag: 'message',
                attrs: {
                    id: msgId,
                    type: 'text',
                    to: destinationJid,
                    ...(additionalAttributes || {})
                },
                content: binaryNodeContent
            };
            const shouldHaveIdentity = !!participants.find(participant => participant.content.find(n => n.attrs.type === 'pkmsg'));
            if (shouldHaveIdentity) {
                stanza.content.push({
                    tag: 'device-identity',
                    attrs: {},
                    content: WAProto_1.proto.ADVSignedDeviceIdentity.encode(authState.creds.account).finish()
                });
                logger.debug({ jid }, 'adding device identity');
            }
            logger.debug({ msgId }, `sending message to ${participants.length} devices`);
            await sendNode(stanza);
        });
        return msgId;
    };
    const waUploadToServer = (0, Utils_1.getWAUploadToServer)(config, refreshMediaConn);
    return {
        ...sock,
        assertSessions,
        relayMessage,
        sendDeliveryReceipt,
        sendReadReceipt,
        refreshMediaConn,
        waUploadToServer,
        fetchPrivacySettings,
        sendMessage: async (jid, content, options = {}) => {
            const userJid = authState.creds.me.id;
            if (typeof content === 'object' &&
                'disappearingMessagesInChat' in content &&
                typeof content['disappearingMessagesInChat'] !== 'undefined' &&
                (0, WABinary_1.isJidGroup)(jid)) {
                const { disappearingMessagesInChat } = content;
                const value = typeof disappearingMessagesInChat === 'boolean' ?
                    (disappearingMessagesInChat ? Defaults_1.WA_DEFAULT_EPHEMERAL : 0) :
                    disappearingMessagesInChat;
                await groupToggleEphemeral(jid, value);
            }
            else {
                const fullMsg = await (0, Utils_1.generateWAMessage)(jid, content, {
                    logger,
                    userJid,
                    // multi-device does not have this yet
                    //getUrlInfo: generateUrlInfo,
                    upload: waUploadToServer,
                    mediaCache: config.mediaCache,
                    ...options,
                });
                const isDeleteMsg = 'delete' in content && !!content.delete;
                const additionalAttributes = {};
                // required for delete
                if (isDeleteMsg) {
                    additionalAttributes.edit = '7';
                }
                await relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id, additionalAttributes });
                if (config.emitOwnEvents) {
                    process.nextTick(() => {
                        ev.emit('messages.upsert', { messages: [fullMsg], type: 'append' });
                    });
                }
                return fullMsg;
            }
        }
    };
};
exports.makeMessagesSocket = makeMessagesSocket;
