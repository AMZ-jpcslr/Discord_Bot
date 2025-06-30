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
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('get_eq')
    .setDescription('直近に発表された地震情報を取得します（気象庁データ）');
function maxScaleToString(maxScale) {
    switch (maxScale) {
        case 10: return '1';
        case 20: return '2';
        case 30: return '3';
        case 40: return '4';
        case 45: return '5弱';
        case 50: return '5強';
        case 55: return '6弱';
        case 60: return '6強';
        case 70: return '7';
        default: return String(maxScale);
    }
}
function execute(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
        yield interaction.deferReply();
        try {
            const res = yield fetch('https://www.jma.go.jp/bosai/quake/data/list.json');
            const list = yield res.json();
            if (!list.length) {
                yield interaction.editReply('直近の地震情報が見つかりませんでした。');
                return;
            }
            const latestId = list[0].json;
            const imageUrl = latestId.replace('.json', '.png');
            const jmaImageUrl = `https://www.jma.go.jp/bosai/quake/data/${imageUrl}`;
            const detailRes = yield fetch(`https://www.jma.go.jp/bosai/quake/data/${latestId}`);
            const detail = yield detailRes.json();
            const time = (_b = (_a = detail.Head) === null || _a === void 0 ? void 0 : _a.ReportDateTime) !== null && _b !== void 0 ? _b : '不明';
            const hypocenter = (_g = (_f = (_e = (_d = (_c = detail.Body) === null || _c === void 0 ? void 0 : _c.Earthquake) === null || _d === void 0 ? void 0 : _d.Hypocenter) === null || _e === void 0 ? void 0 : _e.Area) === null || _f === void 0 ? void 0 : _f.Name) !== null && _g !== void 0 ? _g : '不明';
            const magnitude = (_k = (_j = (_h = detail.Body) === null || _h === void 0 ? void 0 : _h.Earthquake) === null || _j === void 0 ? void 0 : _j.Magnitude) !== null && _k !== void 0 ? _k : '不明';
            const maxScale = (_p = (_o = (_m = (_l = detail.Body) === null || _l === void 0 ? void 0 : _l.Intensity) === null || _m === void 0 ? void 0 : _m.Observation) === null || _o === void 0 ? void 0 : _o.MaxInt) !== null && _p !== void 0 ? _p : '不明';
            const depth = (_u = (_t = (_s = (_r = (_q = detail.Body) === null || _q === void 0 ? void 0 : _q.Earthquake) === null || _r === void 0 ? void 0 : _r.Hypocenter) === null || _s === void 0 ? void 0 : _s.Area) === null || _t === void 0 ? void 0 : _t.Depth) !== null && _u !== void 0 ? _u : '不明';
            const text = (_w = (_v = detail.Head) === null || _v === void 0 ? void 0 : _v.Text) !== null && _w !== void 0 ? _w : '';
            const maxScaleStr = maxScale !== '不明' ? maxScaleToString(Number(maxScale)) : '不明';
            // 震度画像URL
            let shindoImageUrl = undefined;
            switch (maxScale) {
                case 10:
                    shindoImageUrl = 'https://www.data.jma.go.jp/svd/eqev/data/joho/shindo_icon/1.png';
                    break;
                case 20:
                    shindoImageUrl = 'https://www.data.jma.go.jp/svd/eqev/data/joho/shindo_icon/2.png';
                    break;
                case 30:
                    shindoImageUrl = 'https://www.data.jma.go.jp/svd/eqev/data/joho/shindo_icon/3.png';
                    break;
                case 40:
                    shindoImageUrl = 'https://www.data.jma.go.jp/svd/eqev/data/joho/shindo_icon/4.png';
                    break;
                case 45:
                    shindoImageUrl = 'https://www.data.jma.go.jp/svd/eqev/data/joho/shindo_icon/5-.png';
                    break;
                case 50:
                    shindoImageUrl = 'https://www.data.jma.go.jp/svd/eqev/data/joho/shindo_icon/5+.png';
                    break;
                case 55:
                    shindoImageUrl = 'https://www.data.jma.go.jp/svd/eqev/data/joho/shindo_icon/6-.png';
                    break;
                case 60:
                    shindoImageUrl = 'https://www.data.jma.go.jp/svd/eqev/data/joho/shindo_icon/6+.png';
                    break;
                case 70:
                    shindoImageUrl = 'https://www.data.jma.go.jp/svd/eqev/data/joho/shindo_icon/7.png';
                    break;
                default: shindoImageUrl = undefined;
            }
            // 埋め込み作成
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('**地震速報**') // 最大サイズの太字
                .setColor(0x2d3be7)
                .setDescription(`${text ? text + '\n' : ''}` +
                `\n` +
                `**震源**　${hypocenter}\n` +
                `**規模**　M${magnitude}\n` +
                `**深さ**　${depth}\n` +
                `**発生時刻**　${time}\n`);
            // 震度画像を右上サムネイルに
            if (shindoImageUrl) {
                embed.setThumbnail(shindoImageUrl);
            }
            // 震度分布画像（気象庁公式）を埋め込み画像に
            const response = yield fetch(jmaImageUrl);
            if (response.ok) {
                embed.setImage(jmaImageUrl);
            }
            // フッターに出典
            embed.setFooter({ text: 'Earthquake Information by JMA ・ ' + (time || '') });
            yield interaction.editReply({ embeds: [embed] });
        }
        catch (e) {
            console.error(e);
            yield interaction.editReply('地震情報の取得中にエラーが発生しました。');
        }
    });
}
