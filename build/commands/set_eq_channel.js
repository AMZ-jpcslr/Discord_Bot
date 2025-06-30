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
const DATA_PATH = path_1.default.join(__dirname, '../../data/eq_channels.json');
function loadChannels() {
    if (!fs_1.default.existsSync(DATA_PATH))
        return {};
    return JSON.parse(fs_1.default.readFileSync(DATA_PATH, 'utf8'));
}
function saveChannels(data) {
    fs_1.default.mkdirSync(path_1.default.dirname(DATA_PATH), { recursive: true });
    fs_1.default.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('set_eq_channel')
    .setDescription('緊急地震速報の通知チャンネルを設定')
    .addChannelOption(opt => opt.setName('channel')
    .setDescription('通知先チャンネル')
    .addChannelTypes(discord_js_1.ChannelType.GuildText)
    .setRequired(true));
function execute(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        const channel = interaction.options.getChannel('channel', true);
        const guildId = interaction.guildId;
        if (!guildId) {
            yield interaction.reply('このコマンドはサーバー内でのみ使用できます。');
            return;
        }
        const channels = loadChannels();
        channels[guildId] = channel.id;
        saveChannels(channels);
        yield interaction.reply(`緊急地震速報の通知チャンネルを <#${channel.id}> に設定しました。`);
    });
}
