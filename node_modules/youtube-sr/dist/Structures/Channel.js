"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Channel = (function () {
    function Channel(data) {
        if (!data)
            throw new Error("Cannot instantiate the " + this.constructor.name + " class without data!");
        this._patch(data);
    }
    Channel.prototype._patch = function (data) {
        if (!data)
            data = {};
        this.name = data.name || null;
        this.verified = !!data.verified || false;
        this.id = data.id || null;
        this.url = data.url || null;
        this.icon = data.icon || { url: null, width: 0, height: 0 };
        this.subscribers = data.subscribers || null;
    };
    Channel.prototype.iconURL = function (options) {
        if (options === void 0) { options = { size: 0 }; }
        if (typeof options.size !== "number" || options.size < 0)
            throw new Error("invalid icon size");
        if (!this.icon.url)
            return null;
        var def = this.icon.url.split("=s")[1].split("-c")[0];
        return this.icon.url.replace("=s" + def + "-c", "=s" + options.size + "-c");
    };
    Object.defineProperty(Channel.prototype, "type", {
        get: function () {
            return "channel";
        },
        enumerable: false,
        configurable: true
    });
    Channel.prototype.toString = function () {
        return this.name || "";
    };
    Channel.prototype.toJSON = function () {
        return {
            name: this.name,
            verified: this.verified,
            id: this.id,
            url: this.url,
            iconURL: this.iconURL(),
            type: this.type,
            subscribers: this.subscribers
        };
    };
    return Channel;
}());
exports.default = Channel;
