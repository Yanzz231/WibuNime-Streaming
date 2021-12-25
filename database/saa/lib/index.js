"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeWALegacySocket = void 0;
const Socket_1 = __importDefault(require("./Socket"));
const LegacySocket_1 = __importDefault(require("./LegacySocket"));
exports.makeWALegacySocket = LegacySocket_1.default;
__exportStar(require("../WAProto"), exports);
__exportStar(require("./Utils"), exports);
__exportStar(require("./Types"), exports);
//export * from './Store'
__exportStar(require("./Defaults"), exports);
__exportStar(require("./WABinary"), exports);
exports.default = Socket_1.default;
