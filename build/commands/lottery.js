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
    .setName('lottery')
    .setDescription('指定した数の項目からランダムで1つ抽選します')
    .addIntegerOption(option => option.setName('count')
    .setDescription('項目数（2～20）')
    .setRequired(true)
    .setMinValue(2)
    .setMaxValue(20))
    .addStringOption(option => option.setName('items')
    .setDescription('カンマ区切りで項目を入力してください')
    .setRequired(true));
function execute(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        const count = interaction.options.getInteger('count', true);
        const itemsRaw = interaction.options.getString('items', true);
        const items = itemsRaw.split(',').map(s => s.trim()).filter(Boolean);
        if (items.length !== count) {
            yield interaction.reply(`項目数（${count}）と入力された項目の数（${items.length}）が一致しません。`);
            return;
        }
        const winner = items[Math.floor(Math.random() * items.length)];
        yield interaction.reply(`抽選結果: **${winner}**`);
    });
}
