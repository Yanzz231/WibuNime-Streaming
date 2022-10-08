"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YouTube = exports.Video = exports.Playlist = exports.Channel = exports.Thumbnail = exports.Util = void 0;
var Util_1 = __importDefault(require("./Util"));
exports.Util = Util_1.default;
var Channel_1 = __importDefault(require("./Structures/Channel"));
exports.Channel = Channel_1.default;
var Playlist_1 = __importDefault(require("./Structures/Playlist"));
exports.Playlist = Playlist_1.default;
var Video_1 = __importDefault(require("./Structures/Video"));
exports.Video = Video_1.default;
var Thumbnail_1 = __importDefault(require("./Structures/Thumbnail"));
exports.Thumbnail = Thumbnail_1.default;
var SAFE_SEARCH_COOKIE = "PREF=f2=8000000";
var YouTube = (function () {
    function YouTube() {
        throw new Error("The " + this.constructor.name + " class may not be instantiated!");
    }
    YouTube.search = function (query, options) {
        return __awaiter(this, void 0, void 0, function () {
            var filter, url, requestOptions, html;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!options)
                            options = { limit: 20, type: "video", requestOptions: {} };
                        if (!query || typeof query !== "string")
                            throw new Error("Invalid search query \"" + query + "\"!");
                        options.type = options.type || "video";
                        filter = options.type === "all" ? "" : "&sp=" + Util_1.default.filter(options.type);
                        url = "https://youtube.com/results?q=" + encodeURIComponent(query.trim()).replace(/%20/g, "+") + "&hl=en" + filter;
                        requestOptions = options.safeSearch ? __assign(__assign({}, options.requestOptions), { headers: { cookie: SAFE_SEARCH_COOKIE } }) : {};
                        return [4, Util_1.default.getHTML(url, requestOptions)];
                    case 1:
                        html = _a.sent();
                        return [2, Util_1.default.parseSearchResult(html, options)];
                }
            });
        });
    };
    YouTube.searchOne = function (query, type, safeSearch, requestOptions) {
        if (!type)
            type = "video";
        return new Promise(function (resolve) {
            YouTube.search(query, { limit: 1, type: type, requestOptions: requestOptions, safeSearch: Boolean(safeSearch) })
                .then(function (res) {
                if (!res || !res.length)
                    return resolve(null);
                resolve(res[0]);
            })
                .catch(function () {
                resolve(null);
            });
        });
    };
    YouTube.getPlaylist = function (url, options) {
        return __awaiter(this, void 0, void 0, function () {
            var html;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!options)
                            options = { limit: 100, requestOptions: {} };
                        if (!url || typeof url !== "string")
                            throw new Error("Expected playlist url, received " + typeof url + "!");
                        Util_1.default.validatePlaylist(url);
                        url = Util_1.default.getPlaylistURL(url);
                        return [4, Util_1.default.getHTML(url + "&hl=en", options && options.requestOptions)];
                    case 1:
                        html = _a.sent();
                        return [2, Util_1.default.getPlaylist(html, options && options.limit)];
                }
            });
        });
    };
    YouTube.getVideo = function (url, requestOptions) {
        return __awaiter(this, void 0, void 0, function () {
            var isValid, html;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!url)
                            throw new Error("Missing video url");
                        if (url instanceof Video_1.default)
                            url = url.url;
                        isValid = YouTube.validate(url, "VIDEO");
                        if (!isValid)
                            throw new Error("Invalid video url");
                        return [4, Util_1.default.getHTML(url + "&hl=en", requestOptions)];
                    case 1:
                        html = _a.sent();
                        return [2, Util_1.default.getVideo(html)];
                }
            });
        });
    };
    YouTube.homepage = function () {
        return __awaiter(this, void 0, void 0, function () {
            var html;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, Util_1.default.getHTML("https://www.youtube.com?hl=en")];
                    case 1:
                        html = _a.sent();
                        return [2, Util_1.default.parseHomepage(html)];
                }
            });
        });
    };
    YouTube.fetchInnerTubeKey = function () {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function () {
            var html, key;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4, Util_1.default.getHTML("https://www.youtube.com?hl=en")];
                    case 1:
                        html = _d.sent();
                        key = (_b = (_a = html.split('INNERTUBE_API_KEY":"')[1]) === null || _a === void 0 ? void 0 : _a.split('"')[0]) !== null && _b !== void 0 ? _b : (_c = html.split('innertubeApiKey":"')[1]) === null || _c === void 0 ? void 0 : _c.split('"')[0];
                        return [2, key !== null && key !== void 0 ? key : null];
                }
            });
        });
    };
    YouTube.trending = function () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        return __awaiter(this, void 0, void 0, function () {
            var html, json, content, res, _p, _q, item;
            var e_1, _r;
            return __generator(this, function (_s) {
                switch (_s.label) {
                    case 0: return [4, Util_1.default.getHTML("https://www.youtube.com/feed/explore?hl=en")];
                    case 1:
                        html = _s.sent();
                        try {
                            json = JSON.parse(html.split("var ytInitialData =")[1].split(";")[0]);
                        }
                        catch (_t) {
                            return [2, null];
                        }
                        content = (_l = (_k = (_j = (_h = (_g = (_f = (_e = (_d = (_c = (_b = (_a = json.contents) === null || _a === void 0 ? void 0 : _a.twoColumnBrowseResultsRenderer) === null || _b === void 0 ? void 0 : _b.tabs[0].tabRenderer) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.sectionListRenderer) === null || _e === void 0 ? void 0 : _e.contents[1]) === null || _f === void 0 ? void 0 : _f.itemSectionRenderer) === null || _g === void 0 ? void 0 : _g.contents[0]) === null || _h === void 0 ? void 0 : _h.shelfRenderer) === null || _j === void 0 ? void 0 : _j.content) === null || _k === void 0 ? void 0 : _k.expandedShelfContentsRenderer) === null || _l === void 0 ? void 0 : _l.items;
                        if (!content || !Array.isArray(content))
                            return [2, null];
                        res = [];
                        try {
                            for (_p = __values(content.map(function (m) { return m.videoRenderer; })), _q = _p.next(); !_q.done; _q = _p.next()) {
                                item = _q.value;
                                res.push(new Video_1.default({
                                    title: item.title.runs[0].text,
                                    id: item.videoId,
                                    url: "https://www.youtube.com/watch?v=" + item.videoId,
                                    description: (_o = (_m = item.descriptionSnippet) === null || _m === void 0 ? void 0 : _m.runs[0]) === null || _o === void 0 ? void 0 : _o.text,
                                    duration: Util_1.default.parseDuration(item.lengthText.simpleText) / 1000 || 0,
                                    duration_raw: item.lengthText.simpleText,
                                    thumbnail: {
                                        id: item.videoId,
                                        url: item.thumbnail.thumbnails[item.thumbnail.thumbnails.length - 1].url,
                                        height: item.thumbnail.thumbnails[item.thumbnail.thumbnails.length - 1].height,
                                        width: item.thumbnail.thumbnails[item.thumbnail.thumbnails.length - 1].width
                                    },
                                    channel: {
                                        id: item.ownerText.runs[0].navigationEndpoint.browseEndpoint.browseId,
                                        name: item.ownerText.runs[0].text,
                                        url: "https://www.youtube.com" + item.ownerText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl,
                                        icon: {
                                            url: null,
                                            width: 0,
                                            height: 0
                                        },
                                        verified: item.ownerBadges ? Boolean(item.ownerBadges[0].metadataBadgeRenderer.tooltip === "Verified") : false
                                    },
                                    uploadedAt: item.publishedTimeText.simpleText,
                                    views: item.viewCountText.simpleText.replace(/[^0-9]/g, "") || 0
                                }));
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (_q && !_q.done && (_r = _p.return)) _r.call(_p);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                        return [2, res];
                }
            });
        });
    };
    YouTube.getSuggestions = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var res, searchSuggestions;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!query)
                            throw new Error("Search query was not provided!");
                        return [4, Util_1.default.getHTML("https://clients1.google.com/complete/search?client=youtube&gs_ri=youtube&ds=yt&q=" + encodeURIComponent(query))];
                    case 1:
                        res = _a.sent();
                        searchSuggestions = [];
                        res.split("[").forEach(function (ele, index) {
                            if (!ele.split('"')[1] || index === 1)
                                return;
                            return searchSuggestions.push(ele.split('"')[1]);
                        });
                        searchSuggestions.pop();
                        return [2, searchSuggestions];
                }
            });
        });
    };
    YouTube.validate = function (url, type) {
        if (typeof url !== "string")
            return false;
        if (!type)
            type = "PLAYLIST";
        switch (type) {
            case "PLAYLIST":
                return YouTube.Regex.PLAYLIST_URL.test(url);
            case "PLAYLIST_ID":
                return YouTube.Regex.PLAYLIST_ID.test(url);
            case "VIDEO":
                return YouTube.Regex.VIDEO_URL.test(url);
            case "VIDEO_ID":
                return YouTube.Regex.VIDEO_ID.test(url);
            default:
                return false;
        }
    };
    YouTube.isPlaylist = function (src) {
        try {
            Util_1.default.validatePlaylist(src);
            return true;
        }
        catch (_a) {
            return false;
        }
    };
    Object.defineProperty(YouTube, "Regex", {
        get: function () {
            return {
                PLAYLIST_URL: Util_1.default.PlaylistURLRegex,
                PLAYLIST_ID: Util_1.default.PlaylistIDRegex,
                VIDEO_ID: Util_1.default.VideoIDRegex,
                VIDEO_URL: Util_1.default.VideoRegex
            };
        },
        enumerable: false,
        configurable: true
    });
    return YouTube;
}());
exports.YouTube = YouTube;
exports.default = YouTube;
