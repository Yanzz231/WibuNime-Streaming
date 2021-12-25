export * from './Auth';
export * from './GroupMetadata';
export * from './Chat';
export * from './Contact';
export * from './State';
export * from './Message';
export * from './Legacy';
export * from './Socket';
export * from './Events';
import type NodeCache from 'node-cache';
import { AuthenticationState } from './Auth';
import { proto } from '../../WAProto';
import { CommonSocketConfig } from './Socket';
export declare type SocketConfig = CommonSocketConfig<AuthenticationState> & {
    /** provide a cache to store a user's device list */
    userDevicesCache?: NodeCache;
    /** map to store the retry counts for failed messages */
    msgRetryCounterMap?: {
        [msgId: string]: number;
    };
    /** custom domains to push media via */
    customUploadHosts: string[];
    /**
     * fetch a message from your store
     * implement this so that messages failed to send (solves the "this message can take a while" issue) can be retried
     * */
    getMessage: (key: proto.IMessageKey) => Promise<proto.IMessage | undefined>;
};
export declare enum DisconnectReason {
    connectionClosed = 428,
    connectionLost = 408,
    connectionReplaced = 440,
    timedOut = 408,
    loggedOut = 401,
    badSession = 500,
    restartRequired = 410,
    multideviceMismatch = 403
}
export declare type WAInitResponse = {
    ref: string;
    ttl: number;
    status: 200;
};
declare type WABusinessHoursConfig = {
    day_of_week: string;
    mode: string;
    open_time?: number;
    close_time?: number;
};
export declare type WABusinessProfile = {
    description: string;
    email: string;
    business_hours: {
        timezone: string;
        config?: WABusinessHoursConfig[];
        business_config?: WABusinessHoursConfig[];
    };
    website: string[];
    categories: {
        id: string;
        localized_display_name: string;
    }[];
    wid?: string;
};
export declare type CurveKeyPair = {
    private: Uint8Array;
    public: Uint8Array;
};
