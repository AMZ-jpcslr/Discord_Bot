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
function execute(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
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
            const hypocenterObj = (_r = (_q = detail.Body) === null || _q === void 0 ? void 0 : _q.Earthquake) === null || _r === void 0 ? void 0 : _r.Hypocenter;
            console.log('Hypocenter:', hypocenterObj);
            console.log('jmaImageUrl:', jmaImageUrl);
            const response = yield fetch(jmaImageUrl);
            let imageExists = false;
            if (response.ok) {
                imageExists = true;
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('直近の地震情報（気象庁）')
                .setDescription(`発生時刻: ${time}\n震源地: ${hypocenter}\nマグニチュード: ${magnitude}\n最大震度: ${maxScale}`)
                .setColor(0xff9900);
            if (imageExists) {
                embed.setImage(jmaImageUrl);
            }
            yield interaction.editReply({ embeds: [embed] });
        }
        catch (e) {
            console.error(e);
            yield interaction.editReply('地震情報の取得中にエラーが発生しました。');
        }
    });
}
