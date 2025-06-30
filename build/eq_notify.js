"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startEqAutoNotify = startEqAutoNotify;
const discord_js_1 = require("discord.js");
const undici_1 = require("undici");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_PATH = path_1.default.join(__dirname, '../../data/eq_channels.json');
// 通知チャンネル設定をロード
function loadChannels() {
    if (!fs_1.default.existsSync(DATA_PATH))
        return {};
    return JSON.parse(fs_1.default.readFileSync(DATA_PATH, 'utf8'));
}
// 直近の地震IDを保存して重複通知を防ぐ
const latestIdPath = path_1.default.join(__dirname, '../../data/latest_eq_id.txt');
function loadLatestId() {
    if (!fs_1.default.existsSync(latestIdPath))
        return null;
    return fs_1.default.readFileSync(latestIdPath, 'utf8').trim();
}
function saveLatestId(id) {
    fs_1.default.mkdirSync(path_1.default.dirname(latestIdPath), { recursive: true });
    fs_1.default.writeFileSync(latestIdPath, id, 'utf8');
}
// 定期的に気象庁APIを監視して新しい地震があれば通知
function startEqAutoNotify(client) {
    setInterval(() => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
        try {
            const res = yield (0, undici_1.fetch)('https://www.jma.go.jp/bosai/quake/data/list.json');
            const list = yield res.json();
            if (!list.length)
                return;
            const latestId = (_a = list[0]) === null || _a === void 0 ? void 0 : _a.json;
            if (!latestId || typeof latestId !== 'string' || !latestId.endsWith('.json')) {
                console.warn('不正なlatestId:', latestId);
                return;
            }
            if (latestId === loadLatestId())
                return; // すでに通知済み
            const detailUrl = `https://www.jma.go.jp/bosai/quake/data/${latestId}`;
            console.log('地震詳細取得URL:', detailUrl);
            const detailRes = yield (0, undici_1.fetch)(detailUrl);
            const detail = yield detailRes.json(); // ← 型アサーションを追加
            // 必要な情報を抽出
            const time = (_c = (_b = detail.Head) === null || _b === void 0 ? void 0 : _b.ReportDateTime) !== null && _c !== void 0 ? _c : '不明';
            const hypocenter = (_h = (_g = (_f = (_e = (_d = detail.Body) === null || _d === void 0 ? void 0 : _d.Earthquake) === null || _e === void 0 ? void 0 : _e.Hypocenter) === null || _f === void 0 ? void 0 : _f.Area) === null || _g === void 0 ? void 0 : _g.Name) !== null && _h !== void 0 ? _h : '不明';
            const magnitude = (_l = (_k = (_j = detail.Body) === null || _j === void 0 ? void 0 : _j.Earthquake) === null || _k === void 0 ? void 0 : _k.Magnitude) !== null && _l !== void 0 ? _l : '不明';
            const maxScale = (_q = (_p = (_o = (_m = detail.Body) === null || _m === void 0 ? void 0 : _m.Intensity) === null || _o === void 0 ? void 0 : _o.Observation) === null || _p === void 0 ? void 0 : _p.MaxInt) !== null && _q !== void 0 ? _q : '不明';
            const lat = (_t = (_s = (_r = detail.Body) === null || _r === void 0 ? void 0 : _r.Earthquake) === null || _s === void 0 ? void 0 : _s.Hypocenter) === null || _t === void 0 ? void 0 : _t.Latitude;
            const lon = (_w = (_v = (_u = detail.Body) === null || _u === void 0 ? void 0 : _u.Earthquake) === null || _v === void 0 ? void 0 : _v.Hypocenter) === null || _w === void 0 ? void 0 : _w.Longitude;
            const mapUrl = (lat && lon)
                ? `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&z=6&size=450,300&l=map&pt=${lon},${lat},pm2rdm`
                : undefined;
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('【自動通知】地震情報（気象庁）')
                .setDescription(`発生時刻: ${time}\n震源地: ${hypocenter}\nマグニチュード: ${magnitude}\n最大震度: ${maxScale}`)
                .setColor(0xff0000);
            if (mapUrl)
                embed.setImage(mapUrl);
            // 通知チャンネルへ送信
            const channels = loadChannels();
            for (const guildId in channels) {
                const channelId = channels[guildId];
                const guild = client.guilds.cache.get(guildId);
                if (!guild)
                    continue;
                const channel = guild.channels.cache.get(channelId);
                if (channel && channel.isTextBased()) {
                    channel.send({ embeds: [embed] });
                }
            }
            saveLatestId(latestId);
        }
        catch (e) {
            console.error('地震自動通知エラー:', e);
        }
    }), 60 * 1000); // 1分ごとにチェック
}
