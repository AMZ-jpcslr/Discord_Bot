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
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_PATH = path_1.default.join(__dirname, '../../data/shifts.json');
// データ読み書き
function loadShifts() {
    if (!fs_1.default.existsSync(DATA_PATH))
        return {};
    return JSON.parse(fs_1.default.readFileSync(DATA_PATH, 'utf8'));
}
function saveShifts(data) {
    fs_1.default.mkdirSync(path_1.default.dirname(DATA_PATH), { recursive: true });
    fs_1.default.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('shift')
    .setDescription('シフト管理コマンド')
    .addSubcommand(sub => sub.setName('add')
    .setDescription('シフトを登録')
    .addStringOption(opt => opt.setName('date')
    .setDescription('日付 (例: 2025-07-01)')
    .setRequired(true))
    .addStringOption(opt => opt.setName('detail')
    .setDescription('シフト内容 (例: 9:00-18:00)')
    .setRequired(true)))
    .addSubcommand(sub => sub.setName('show')
    .setDescription('自分のシフトをカレンダー形式で表示'));
function execute(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        const sub = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const shifts = loadShifts();
        if (sub === 'add') {
            const date = interaction.options.getString('date', true);
            const detail = interaction.options.getString('detail', true);
            if (!shifts[userId])
                shifts[userId] = {};
            shifts[userId][date] = detail;
            saveShifts(shifts);
            yield interaction.reply(`✅ ${date} のシフト「${detail}」を登録しました。`);
        }
        else if (sub === 'show') {
            const userShifts = shifts[userId];
            if (!userShifts || Object.keys(userShifts).length === 0) {
                yield interaction.reply('登録されたシフトがありません。');
                return;
            }
            // 日付順に並べる
            const sorted = Object.entries(userShifts).sort(([a], [b]) => a.localeCompare(b));
            let desc = '';
            for (const [date, detail] of sorted) {
                desc += `**${date}**: ${detail}\n`;
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle(`${interaction.user.username}さんのシフト`)
                .setDescription(desc)
                .setColor(0x00bfff);
            yield interaction.reply({ embeds: [embed] });
        }
    });
}
