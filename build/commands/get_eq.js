"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
// node-fetchのESM対応: applyを使わず直接引数を渡す
const fetch = (...args) => Promise.resolve().then(() => __importStar(require('node-fetch'))).then(mod => mod.default(args[0], args[1]));
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('get_eq')
    .setDescription('直近に発表された地震情報を取得します');
function execute(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        yield interaction.deferReply();
        try {
            const res = yield fetch('https://api.p2pquake.net/v2/history?codes=551,554,561,565&limit=1');
            const json = yield res.json();
            if (!json.length) {
                yield interaction.editReply('直近の地震情報が見つかりませんでした。');
                return;
            }
            const eq = json[0];
            const { time, hypocenter, magnitude, maxScale } = eq;
            const lat = hypocenter === null || hypocenter === void 0 ? void 0 : hypocenter.latitude;
            const lon = hypocenter === null || hypocenter === void 0 ? void 0 : hypocenter.longitude;
            const place = (hypocenter === null || hypocenter === void 0 ? void 0 : hypocenter.name) || '不明';
            const mapUrl = (lat && lon)
                ? `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&z=6&size=450,300&l=map&pt=${lon},${lat},pm2rdm`
                : undefined;
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('直近の地震情報')
                .setDescription(`発生時刻: ${time}\n震源地: ${place}\nマグニチュード: ${magnitude !== null && magnitude !== void 0 ? magnitude : '不明'}\n最大震度: ${maxScale !== null && maxScale !== void 0 ? maxScale : '不明'}`)
                .setColor(0xff9900);
            if (mapUrl)
                embed.setImage(mapUrl);
            yield interaction.editReply({ embeds: [embed] });
        }
        catch (e) {
            yield interaction.editReply('地震情報の取得中にエラーが発生しました。');
        }
    });
}
