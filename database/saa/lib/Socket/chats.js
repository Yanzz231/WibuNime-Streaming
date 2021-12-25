"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeChatsSocket = void 0;
const WABinary_1 = require("../WABinary");
const WAProto_1 = require("../../WAProto");
const Utils_1 = require("../Utils");
const messages_send_1 = require("./messages-send");
const make_mutex_1 = __importDefault(require("../Utils/make-mutex"));
const boom_1 = require("@hapi/boom");
const MAX_SYNC_ATTEMPTS = 5;
const makeChatsSocket = (config) => {
    const { logger } = config;
    const sock = (0, messages_send_1.makeMessagesSocket)(config);
    const { ev, ws, authState, generateMessageTag, sendNode, query, fetchPrivacySettings, } = sock;
    const mutationMutex = (0, make_mutex_1.default)();
    const getAppStateSyncKey = async (keyId) => {
        const { [keyId]: key } = await authState.keys.get('app-state-sync-key', [keyId]);
        return key;
    };
    const interactiveQuery = async (userNodes, queryNode) => {
        const result = await query({
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
                        context: 'interactive',
                    },
                    content: [
                        {
                            tag: 'query',
                            attrs: {},
                            content: [queryNode]
                        },
                        {
                            tag: 'list',
                            attrs: {},
                            content: userNodes
                        }
                    ]
                }
            ],
        });
        const usyncNode = (0, WABinary_1.getBinaryNodeChild)(result, 'usync');
        const listNode = (0, WABinary_1.getBinaryNodeChild)(usyncNode, 'list');
        const users = (0, WABinary_1.getBinaryNodeChildren)(listNode, 'user');
        return users;
    };
    const onWhatsApp = async (...jids) => {
        const results = await interactiveQuery([
            {
                tag: 'user',
                attrs: {},
                content: jids.map(jid => ({
                    tag: 'contact',
                    attrs: {},
                    content: `+${jid}`
                }))
            }
        ], { tag: 'contact', attrs: {} });
        return results.map(user => {
            const contact = (0, WABinary_1.getBinaryNodeChild)(user, 'contact');
            return { exists: contact.attrs.type === 'in', jid: user.attrs.jid };
        }).filter(item => item.exists);
    };
    const fetchStatus = async (jid) => {
        const [result] = await interactiveQuery([{ tag: 'user', attrs: { jid } }], { tag: 'status', attrs: {} });
        if (result) {
            const status = (0, WABinary_1.getBinaryNodeChild)(result, 'status');
            return {
                status: status.content.toString(),
                setAt: new Date(+status.attrs.t * 1000)
            };
        }
    };
    const updateProfilePicture = async (jid, content) => {
        const { img } = await (0, Utils_1.generateProfilePicture)(content);
        await query({
            tag: 'iq',
            attrs: {
                to: (0, WABinary_1.jidNormalizedUser)(jid),
                type: 'set',
                xmlns: 'w:profile:picture'
            },
            content: [
                {
                    tag: 'picture',
                    attrs: { type: 'image' },
                    content: img
                }
            ]
        });
    };
    const fetchBlocklist = async () => {
        var _a, _b;
        const result = await query({
            tag: 'iq',
            attrs: {
                xmlns: 'blocklist',
                to: WABinary_1.S_WHATSAPP_NET,
                type: 'get'
            }
        });
        const child = (_a = result.content) === null || _a === void 0 ? void 0 : _a[0];
        return (_b = child.content) === null || _b === void 0 ? void 0 : _b.map(i => i.attrs.jid);
    };
    const updateBlockStatus = async (jid, action) => {
        await query({
            tag: 'iq',
            attrs: {
                xmlns: 'blocklist',
                to: WABinary_1.S_WHATSAPP_NET,
                type: 'set'
            },
            content: [
                {
                    tag: 'item',
                    attrs: {
                        action,
                        jid
                    }
                }
            ]
        });
    };
    const updateAccountSyncTimestamp = async (fromTimestamp) => {
        logger.info({ fromTimestamp }, 'requesting account sync');
        await sendNode({
            tag: 'iq',
            attrs: {
                to: WABinary_1.S_WHATSAPP_NET,
                type: 'set',
                xmlns: 'urn:xmpp:whatsapp:dirty',
                id: generateMessageTag(),
            },
            content: [
                {
                    tag: 'clean',
                    attrs: {
                        type: 'account_sync',
                        timestamp: fromTimestamp.toString(),
                    }
                }
            ]
        });
    };
    const resyncAppState = async (collections, fromScratch = false) => {
        const appStateChunk = { totalMutations: [], collectionsToHandle: [] };
        await authState.keys.transaction(async () => {
            const collectionsToHandle = new Set(collections);
            // in case something goes wrong -- ensure we don't enter a loop that cannot be exited from 
            const attemptsMap = {};
            // keep executing till all collections are done
            // sometimes a single patch request will not return all the patches (God knows why)
            // so we fetch till they're all done (this is determined by the "has_more_patches" flag)
            while (collectionsToHandle.size) {
                const states = {};
                const nodes = [];
                for (const name of collectionsToHandle) {
                    let state;
                    if (!fromScratch) {
                        const result = await authState.keys.get('app-state-sync-version', [name]);
                        state = result[name];
                    }
                    if (!state)
                        state = (0, Utils_1.newLTHashState)();
                    states[name] = state;
                    logger.info(`resyncing ${name} from v${state.version}`);
                    nodes.push({
                        tag: 'collection',
                        attrs: {
                            name,
                            version: state.version.toString(),
                            // return snapshot if being synced from scratch
                            return_snapshot: (!state.version).toString()
                        }
                    });
                }
                const result = await query({
                    tag: 'iq',
                    attrs: {
                        to: WABinary_1.S_WHATSAPP_NET,
                        xmlns: 'w:sync:app:state',
                        type: 'set'
                    },
                    content: [
                        {
                            tag: 'sync',
                            attrs: {},
                            content: nodes
                        }
                    ]
                });
                const decoded = await (0, Utils_1.extractSyncdPatches)(result); // extract from binary node
                for (const key in decoded) {
                    const name = key;
                    const { patches, hasMorePatches, snapshot } = decoded[name];
                    try {
                        if (snapshot) {
                            const newState = await (0, Utils_1.decodeSyncdSnapshot)(name, snapshot, getAppStateSyncKey);
                            states[name] = newState;
                            logger.info(`restored state of ${name} from snapshot to v${newState.version}`);
                            await authState.keys.set({ 'app-state-sync-version': { [name]: newState } });
                        }
                        // only process if there are syncd patches
                        if (patches.length) {
                            const { newMutations, state: newState } = await (0, Utils_1.decodePatches)(name, patches, states[name], getAppStateSyncKey, true);
                            await authState.keys.set({ 'app-state-sync-version': { [name]: newState } });
                            logger.info(`synced ${name} to v${newState.version}`);
                            if (newMutations.length) {
                                logger.trace({ newMutations, name }, 'recv new mutations');
                            }
                            appStateChunk.totalMutations.push(...newMutations);
                        }
                        if (hasMorePatches) {
                            logger.info(`${name} has more patches...`);
                        }
                        else { // collection is done with sync
                            collectionsToHandle.delete(name);
                        }
                    }
                    catch (error) {
                        logger.info({ name, error: error.stack }, 'failed to sync state from version, removing and trying from scratch');
                        await authState.keys.set({ "app-state-sync-version": { [name]: null } });
                        attemptsMap[name] = (attemptsMap[name] || 0) + 1;
                        if (attemptsMap[name] >= MAX_SYNC_ATTEMPTS) {
                            collectionsToHandle.delete(name);
                        }
                    }
                }
            }
        });
        processSyncActions(appStateChunk.totalMutations);
        return appStateChunk;
    };
    /**
     * fetch the profile picture of a user/group
     * type = "preview" for a low res picture
     * type = "image for the high res picture"
     */
    const profilePictureUrl = async (jid, type = 'preview', timeoutMs) => {
        var _a;
        jid = (0, WABinary_1.jidNormalizedUser)(jid);
        const result = await query({
            tag: 'iq',
            attrs: {
                to: jid,
                type: 'get',
                xmlns: 'w:profile:picture'
            },
            content: [
                { tag: 'picture', attrs: { type, query: 'url' } }
            ]
        }, timeoutMs);
        const child = (0, WABinary_1.getBinaryNodeChild)(result, 'picture');
        return (_a = child === null || child === void 0 ? void 0 : child.attrs) === null || _a === void 0 ? void 0 : _a.url;
    };
    const sendPresenceUpdate = async (type, toJid) => {
        const me = authState.creds.me;
        if (type === 'available' || type === 'unavailable') {
            await sendNode({
                tag: 'presence',
                attrs: {
                    name: me.name,
                    type
                }
            });
        }
        else {
            await sendNode({
                tag: 'chatstate',
                attrs: {
                    from: me.id,
                    to: toJid,
                },
                content: [
                    { tag: type, attrs: {} }
                ]
            });
        }
    };
    const presenceSubscribe = (toJid) => (sendNode({
        tag: 'presence',
        attrs: {
            to: toJid,
            id: generateMessageTag(),
            type: 'subscribe'
        }
    }));
    const handlePresenceUpdate = ({ tag, attrs, content }) => {
        let presence;
        const jid = attrs.from;
        const participant = attrs.participant || attrs.from;
        if (tag === 'presence') {
            presence = {
                lastKnownPresence: attrs.type === 'unavailable' ? 'unavailable' : 'available',
                lastSeen: attrs.t ? +attrs.t : undefined
            };
        }
        else if (Array.isArray(content)) {
            const [firstChild] = content;
            let type = firstChild.tag;
            if (type === 'paused') {
                type = 'available';
            }
            presence = { lastKnownPresence: type };
        }
        else {
            logger.error({ tag, attrs, content }, 'recv invalid presence node');
        }
        if (presence) {
            ev.emit('presence.update', { id: jid, presences: { [participant]: presence } });
        }
    };
    const resyncMainAppState = async () => {
        logger.debug('resyncing main app state');
        await (mutationMutex.mutex(() => resyncAppState([
            'critical_block',
            'critical_unblock_low',
            'regular_high',
            'regular_low',
            'regular'
        ]))
            .catch(err => (logger.warn({ trace: err.stack }, 'failed to sync app state'))));
    };
    const processSyncActions = (actions) => {
        var _a, _b, _c, _d, _e;
        const updates = {};
        const contactUpdates = {};
        const msgDeletes = [];
        for (const { syncAction: { value: action }, index: [_, id, msgId, fromMe] } of actions) {
            const update = { id };
            if (action === null || action === void 0 ? void 0 : action.muteAction) {
                update.mute = ((_a = action.muteAction) === null || _a === void 0 ? void 0 : _a.muted) ?
                    (0, Utils_1.toNumber)(action.muteAction.muteEndTimestamp) :
                    undefined;
            }
            else if (action === null || action === void 0 ? void 0 : action.archiveChatAction) {
                update.archive = !!((_b = action.archiveChatAction) === null || _b === void 0 ? void 0 : _b.archived);
            }
            else if (action === null || action === void 0 ? void 0 : action.markChatAsReadAction) {
                update.unreadCount = !!((_c = action.markChatAsReadAction) === null || _c === void 0 ? void 0 : _c.read) ? 0 : -1;
            }
            else if (action === null || action === void 0 ? void 0 : action.clearChatAction) {
                msgDeletes.push({
                    remoteJid: id,
                    id: msgId,
                    fromMe: fromMe === '1'
                });
            }
            else if (action === null || action === void 0 ? void 0 : action.contactAction) {
                contactUpdates[id] = {
                    ...(contactUpdates[id] || {}),
                    id,
                    name: action.contactAction.fullName
                };
            }
            else if (action === null || action === void 0 ? void 0 : action.pushNameSetting) {
                const me = {
                    ...authState.creds.me,
                    name: (_d = action === null || action === void 0 ? void 0 : action.pushNameSetting) === null || _d === void 0 ? void 0 : _d.name
                };
                ev.emit('creds.update', { me });
            }
            else if (action === null || action === void 0 ? void 0 : action.pinAction) {
                update.pin = ((_e = action.pinAction) === null || _e === void 0 ? void 0 : _e.pinned) ? (0, Utils_1.toNumber)(action.timestamp) : undefined;
            }
            else {
                logger.warn({ action, id }, 'unprocessable update');
            }
            if (Object.keys(update).length > 1) {
                updates[update.id] = {
                    ...(updates[update.id] || {}),
                    ...update
                };
            }
        }
        if (Object.values(updates).length) {
            ev.emit('chats.update', Object.values(updates));
        }
        if (Object.values(contactUpdates).length) {
            ev.emit('contacts.upsert', Object.values(contactUpdates));
        }
        if (msgDeletes.length) {
            ev.emit('messages.delete', { keys: msgDeletes });
        }
    };
    const appPatch = async (patchCreate) => {
        const name = patchCreate.type;
        const myAppStateKeyId = authState.creds.myAppStateKeyId;
        if (!myAppStateKeyId) {
            throw new boom_1.Boom(`App state key not present!`, { statusCode: 400 });
        }
        await mutationMutex.mutex(async () => {
            logger.debug({ patch: patchCreate }, 'applying app patch');
            await resyncAppState([name]);
            const { [name]: initial } = await authState.keys.get('app-state-sync-version', [name]);
            const { patch, state } = await (0, Utils_1.encodeSyncdPatch)(patchCreate, myAppStateKeyId, initial, getAppStateSyncKey);
            const node = {
                tag: 'iq',
                attrs: {
                    to: WABinary_1.S_WHATSAPP_NET,
                    type: 'set',
                    xmlns: 'w:sync:app:state'
                },
                content: [
                    {
                        tag: 'sync',
                        attrs: {},
                        content: [
                            {
                                tag: 'collection',
                                attrs: {
                                    name,
                                    version: (state.version - 1).toString(),
                                    return_snapshot: 'false'
                                },
                                content: [
                                    {
                                        tag: 'patch',
                                        attrs: {},
                                        content: WAProto_1.proto.SyncdPatch.encode(patch).finish()
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };
            await query(node);
            await authState.keys.set({ 'app-state-sync-version': { [name]: state } });
            if (config.emitOwnEvents) {
                const result = await (0, Utils_1.decodePatches)(name, [{ ...patch, version: { version: state.version }, }], initial, getAppStateSyncKey);
                processSyncActions(result.newMutations);
            }
        });
    };
    /** sending abt props may fix QR scan fail if server expects */
    const fetchAbt = async () => {
        const abtNode = await query({
            tag: 'iq',
            attrs: {
                to: WABinary_1.S_WHATSAPP_NET,
                xmlns: 'abt',
                type: 'get',
                id: generateMessageTag(),
            },
            content: [
                { tag: 'props', attrs: { protocol: '1' } }
            ]
        });
        const propsNode = (0, WABinary_1.getBinaryNodeChild)(abtNode, 'props');
        let props = {};
        if (propsNode) {
            props = (0, WABinary_1.reduceBinaryNodeToDictionary)(propsNode, 'prop');
        }
        logger.debug('fetched abt');
        return props;
    };
    /** sending non-abt props may fix QR scan fail if server expects */
    const fetchProps = async () => {
        const resultNode = await query({
            tag: 'iq',
            attrs: {
                to: WABinary_1.S_WHATSAPP_NET,
                xmlns: 'w',
                type: 'get',
                id: generateMessageTag(),
            },
            content: [
                { tag: 'props', attrs: {} }
            ]
        });
        const propsNode = (0, WABinary_1.getBinaryNodeChild)(resultNode, 'props');
        let props = {};
        if (propsNode) {
            props = (0, WABinary_1.reduceBinaryNodeToDictionary)(propsNode, 'prop');
        }
        logger.debug('fetched props');
        return props;
    };
    /**
     * modify a chat -- mark unread, read etc.
     * lastMessages must be sorted in reverse chronologically
     * requires the last messages till the last message received; required for archive & unread
    */
    const chatModify = (mod, jid) => {
        const patch = (0, Utils_1.chatModificationToAppPatch)(mod, jid);
        return appPatch(patch);
    };
    ws.on('CB:presence', handlePresenceUpdate);
    ws.on('CB:chatstate', handlePresenceUpdate);
    ws.on('CB:ib,,dirty', async (node) => {
        const { attrs } = (0, WABinary_1.getBinaryNodeChild)(node, 'dirty');
        const type = attrs.type;
        switch (type) {
            case 'account_sync':
                let { lastAccountSyncTimestamp } = authState.creds;
                if (lastAccountSyncTimestamp) {
                    await updateAccountSyncTimestamp(lastAccountSyncTimestamp);
                }
                lastAccountSyncTimestamp = +attrs.timestamp;
                ev.emit('creds.update', { lastAccountSyncTimestamp });
                break;
            default:
                logger.info({ node }, `received unknown sync`);
                break;
        }
    });
    ws.on('CB:notification,type:server_sync', (node) => {
        const update = (0, WABinary_1.getBinaryNodeChild)(node, 'collection');
        if (update) {
            const name = update.attrs.name;
            mutationMutex.mutex(async () => {
                await resyncAppState([name], false)
                    .catch(err => logger.error({ trace: err.stack, node }, `failed to sync state`));
            });
        }
    });
    ev.on('connection.update', ({ connection }) => {
        if (connection === 'open') {
            sendPresenceUpdate('available');
            fetchBlocklist();
            fetchPrivacySettings();
            fetchAbt();
            fetchProps();
        }
    });
    return {
        ...sock,
        appPatch,
        sendPresenceUpdate,
        presenceSubscribe,
        profilePictureUrl,
        onWhatsApp,
        fetchBlocklist,
        fetchStatus,
        updateProfilePicture,
        updateBlockStatus,
        resyncAppState,
        chatModify,
        resyncMainAppState,
    };
};
exports.makeChatsSocket = makeChatsSocket;
