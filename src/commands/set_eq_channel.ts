import { SlashCommandBuilder, ChatInputCommandInteraction, ChannelType } from 'discord.js'
import fs from 'fs'
import path from 'path'

const DATA_PATH = path.join(__dirname, '../../data/eq_channels.json')

function loadChannels(): Record<string, string> {
    if (!fs.existsSync(DATA_PATH)) return {}
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
}
function saveChannels(data: Record<string, string>) {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true })
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8')
}

export const data = new SlashCommandBuilder()
    .setName('set_eq_channel')
    .setDescription('緊急地震速報の通知チャンネルを設定')
    .addChannelOption(opt =>
        opt.setName('channel')
            .setDescription('通知先チャンネル')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
    )

export async function execute(interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel('channel', true)
    const guildId = interaction.guildId
    if (!guildId) {
        await interaction.reply('このコマンドはサーバー内でのみ使用できます。')
        return
    }
    const channels = loadChannels()
    channels[guildId] = channel.id
    saveChannels(channels)
    await interaction.reply(`緊急地震速報の通知チャンネルを <#${channel.id}> に設定しました。`)
}