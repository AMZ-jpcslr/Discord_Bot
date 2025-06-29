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
    .setDescription('日付 (YYYY-MM-DD)')
    .setRequired(true)
    .setMinLength(10)
    .setMaxLength(10))
    .addStringOption(opt => opt.setName('start')
    .setDescription('開始時刻 (例: 09:00)')
    .setRequired(true))
    .addStringOption(opt => opt.setName('end')
    .setDescription('終了時刻 (例: 18:00)')
    .setRequired(true)))
    .addSubcommand(sub => sub.setName('show')
    .setDescription('今週のシフトをカレンダー形式で表示'))
    .addSubcommand(sub => sub.setName('delete')
    .setDescription('指定した日付のシフトを削除')
    .addStringOption(opt => opt.setName('date')
    .setDescription('削除する日付 (YYYY-MM-DD)')
    .setRequired(true)
    .setMinLength(10)
    .setMaxLength(10)))
    .addSubcommand(sub => sub.setName('edit')
    .setDescription('指定した日付のシフトを編集')
    .addStringOption(opt => opt.setName('date')
    .setDescription('編集する日付 (YYYY-MM-DD)')
    .setRequired(true)
    .setMinLength(10)
    .setMaxLength(10))
    .addStringOption(opt => opt.setName('start')
    .setDescription('新しい開始時刻 (例: 10:00)')
    .setRequired(true))
    .addStringOption(opt => opt.setName('end')
    .setDescription('新しい終了時刻 (例: 19:00)')
    .setRequired(true)));
function getWeekDates(baseDate) {
    // baseDateを含む週の日曜～土曜の日付配列を返す
    const day = baseDate.getDay();
    const sunday = new Date(baseDate);
    sunday.setDate(baseDate.getDate() - day);
    const week = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(sunday);
        d.setDate(sunday.getDate() + i);
        week.push(d.toISOString().slice(0, 10));
    }
    return week;
}
function execute(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        const sub = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const shifts = loadShifts();
        if (sub === 'add') {
            const date = interaction.options.getString('date', true);
            const start = interaction.options.getString('start', true);
            const end = interaction.options.getString('end', true);
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                yield interaction.reply('日付はYYYY-MM-DD形式で入力してください。');
                return;
            }
            if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
                yield interaction.reply('開始時刻・終了時刻はHH:MM形式で入力してください。');
                return;
            }
            if (!shifts[userId])
                shifts[userId] = {};
            shifts[userId][date] = `${start} - ${end}`;
            saveShifts(shifts);
            yield interaction.reply(`✅ ${date} のシフト「${start} - ${end}」を登録しました。`);
        }
        else if (sub === 'show') {
            const userShifts = shifts[userId];
            if (!userShifts || Object.keys(userShifts).length === 0) {
                yield interaction.reply('登録されたシフトがありません。');
                return;
            }
            const now = new Date();
            const weekDates = getWeekDates(now);
            const weekLabels = ['日', '月', '火', '水', '木', '金', '土'];
            let calendar = '| ' + weekLabels.join(' | ') + ' |\n|:--:|:--:|:--:|:--:|:--:|:--:|:--:|\n|';
            for (let i = 0; i < 7; i++) {
                const date = weekDates[i];
                calendar += userShifts[date] ? ` ${userShifts[date]} ` : ' - ';
                calendar += ' |';
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle(`${interaction.user.username}さんの今週のシフト`)
                .setDescription(calendar)
                .setFooter({ text: `週: ${weekDates[0]} ～ ${weekDates[6]}` })
                .setColor(0x00bfff);
            yield interaction.reply({ embeds: [embed] });
        }
        else if (sub === 'delete') {
            const date = interaction.options.getString('date', true);
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                yield interaction.reply('日付はYYYY-MM-DD形式で入力してください。');
                return;
            }
            if (!shifts[userId] || !shifts[userId][date]) {
                yield interaction.reply(`指定した日付（${date}）のシフトは登録されていません。`);
                return;
            }
            delete shifts[userId][date];
            saveShifts(shifts);
            yield interaction.reply(`🗑️ ${date} のシフトを削除しました。`);
        }
        else if (sub === 'edit') {
            const date = interaction.options.getString('date', true);
            const start = interaction.options.getString('start', true);
            const end = interaction.options.getString('end', true);
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                yield interaction.reply('日付はYYYY-MM-DD形式で入力してください。');
                return;
            }
            if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
                yield interaction.reply('開始時刻・終了時刻はHH:MM形式で入力してください。');
                return;
            }
            if (!shifts[userId] || !shifts[userId][date]) {
                yield interaction.reply(`指定した日付（${date}）のシフトは登録されていません。`);
                return;
            }
            shifts[userId][date] = `${start} - ${end}`;
            saveShifts(shifts);
            yield interaction.reply(`✏️ ${date} のシフトを「${start} - ${end}」に編集しました。`);
        }
    });
}
