"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Channel_1 = __importDefault(require("./Channel"));
var Thumbnail_1 = __importDefault(require("./Thumbnail"));
var Video = (function () {
    function Video(data) {
        if (!data)
            throw new Error("Cannot instantiate the " + this.constructor.name + " class without data!");
        this._patch(data);
    }
    Video.prototype._patch = function (data) {
        var _a, _b;
        if (!data)
            data = {};
        this.id = data.id || null;
        this.title = data.title || null;
        this.description = data.description || null;
        this.durationFormatted = data.duration_raw || "0:00";
        this.duration = (data.duration < 0 ? 0 : data.duration) || 0;
        this.uploadedAt = data.uploadedAt || null;
        this.views = parseInt(data.views) || 0;
        this.thumbnail = new Thumbnail_1.default(data.thumbnail || {});
        this.channel = new Channel_1.default(data.channel || {});
        this.likes = ((_a = data.ratings) === null || _a === void 0 ? void 0 : _a.likes) || 0;
        this.dislikes = ((_b = data.ratings) === null || _b === void 0 ? void 0 : _b.dislikes) || 0;
        this.live = !!data.live;
        this.private = !!data.private;
        this.tags = data.tags || [];
        this.videos = data.videos || [];
    };
    Object.defineProperty(Video.prototype, "url", {
        get: function () {
            if (!this.id)
                return null;
            return "https://www.youtube.com/watch?v=" + this.id;
        },
        enumerable: false,
        configurable: true
    });
    Video.prototype.embedHTML = function (options) {
        if (options === void 0) { options = { id: "ytplayer", width: 640, height: 360 }; }
        if (!this.id)
            return null;
        return "<iframe title=\"__youtube_sr_frame__\" id=\"" + (options.id || "ytplayer") + "\" type=\"text/html\" width=\"" + (options.width || 640) + "\" height=\"" + (options.height || 360) + "\" src=\"" + this.embedURL + "\" frameborder=\"0\"></iframe>";
    };
    Object.defineProperty(Video.prototype, "embedURL", {
        get: function () {
            if (!this.id)
                return null;
            return "https://www.youtube.com/embed/" + this.id;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Video.prototype, "type", {
        get: function () {
            return "video";
        },
        enumerable: false,
        configurable: true
    });
    Video.prototype.toString = function () {
        return this.url || "";
    };
    Video.prototype.toJSON = function () {
        return {
            id: this.id,
            url: this.url,
            title: this.title,
            description: this.description,
            duration: this.duration,
            duration_formatted: this.durationFormatted,
            uploadedAt: this.uploadedAt,
            thumbnail: this.thumbnail.toJSON(),
            channel: {
                name: this.channel.name,
                id: this.channel.id,
                icon: this.channel.iconURL()
            },
            views: this.views,
            type: this.type,
            tags: this.tags,
            ratings: {
                likes: this.likes,
                dislikes: this.dislikes
            },
            live: this.live,
            private: this.private
        };
    };
    return Video;
}());
exports.default = Video;
