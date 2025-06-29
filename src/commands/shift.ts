import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'
import fs from 'fs'
import path from 'path'

const DATA_PATH = path.join(__dirname, '../../data/shifts.json')

// データ読み書き
function loadShifts(): Record<string, Record<string, string>> {
    if (!fs.existsSync(DATA_PATH)) return {}
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
}
function saveShifts(data: Record<string, Record<string, string>>) {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true })
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8')
}

export const data = new SlashCommandBuilder()
    .setName('shift')
    .setDescription('シフト管理コマンド')
    .addSubcommand(sub =>
        sub.setName('add')
            .setDescription('シフトを登録')
            .addStringOption(opt =>
                opt.setName('date')
                    .setDescription('日付 (例: 2025-07-01)')
                    .setRequired(true)
            )
            .addStringOption(opt =>
                opt.setName('detail')
                    .setDescription('シフト内容 (例: 9:00-18:00)')
                    .setRequired(true)
            )
    )
    .addSubcommand(sub =>
        sub.setName('show')
            .setDescription('自分のシフトをカレンダー形式で表示')
    )

export async function execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand()
    const userId = interaction.user.id
    const shifts = loadShifts()

    if (sub === 'add') {
        const date = interaction.options.getString('date', true)
        const detail = interaction.options.getString('detail', true)
        if (!shifts[userId]) shifts[userId] = {}
        shifts[userId][date] = detail
        saveShifts(shifts)
        await interaction.reply(`✅ ${date} のシフト「${detail}」を登録しました。`)
    } else if (sub === 'show') {
        const userShifts = shifts[userId]
        if (!userShifts || Object.keys(userShifts).length === 0) {
            await interaction.reply('登録されたシフトがありません。')
            return
        }
        // 日付順に並べる
        const sorted = Object.entries(userShifts).sort(([a], [b]) => a.localeCompare(b))
        let desc = ''
        for (const [date, detail] of sorted) {
            desc += `**${date}**: ${detail}\n`
        }
        const embed = new EmbedBuilder()
            .setTitle(`${interaction.user.username}さんのシフト`)
            .setDescription(desc)
            .setColor(0x00bfff)
        await interaction.reply({ embeds: [embed] })
    }
}