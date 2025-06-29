import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'
import fs from 'fs'
import path from 'path'

const DATA_PATH = path.join(__dirname, '../../data/shifts.json')

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
                    .setDescription('日付 (YYYY-MM-DD)')
                    .setRequired(true)
                    .setMinLength(10)
                    .setMaxLength(10)
            )
            .addStringOption(opt =>
                opt.setName('start')
                    .setDescription('開始時刻 (例: 09:00)')
                    .setRequired(true)
            )
            .addStringOption(opt =>
                opt.setName('end')
                    .setDescription('終了時刻 (例: 18:00)')
                    .setRequired(true)
            )
    )
    .addSubcommand(sub =>
        sub.setName('show')
            .setDescription('指定した月のシフトをカレンダー形式で表示')
            .addIntegerOption(opt =>
                opt.setName('year')
                    .setDescription('年 (例: 2025)')
                    .setRequired(true)
                    .setMinValue(2000)
                    .setMaxValue(2100)
            )
            .addIntegerOption(opt =>
                opt.setName('month')
                    .setDescription('月 (1-12)')
                    .setRequired(true)
                    .setMinValue(1)
                    .setMaxValue(12)
            )
    )
    .addSubcommand(sub =>
        sub.setName('delete')
            .setDescription('指定した日付のシフトを削除')
            .addStringOption(opt =>
                opt.setName('date')
                    .setDescription('削除する日付 (YYYY-MM-DD)')
                    .setRequired(true)
                    .setMinLength(10)
                    .setMaxLength(10)
            )
    )
    .addSubcommand(sub =>
        sub.setName('edit')
            .setDescription('指定した日付のシフトを編集')
            .addStringOption(opt =>
                opt.setName('date')
                    .setDescription('編集する日付 (YYYY-MM-DD)')
                    .setRequired(true)
                    .setMinLength(10)
                    .setMaxLength(10)
            )
            .addStringOption(opt =>
                opt.setName('start')
                    .setDescription('新しい開始時刻 (例: 10:00)')
                    .setRequired(true)
            )
            .addStringOption(opt =>
                opt.setName('end')
                    .setDescription('新しい終了時刻 (例: 19:00)')
                    .setRequired(true)
            )
    )

function getMonthCalendar(year: number, month: number): string[][] {
    // 1日から月末までの日付を週ごとに2次元配列で返す
    const weeks: string[][] = []
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    let week: string[] = []
    // 1日目の曜日まで空欄
    for (let i = 0; i < firstDay.getDay(); i++) week.push('')
    for (let d = 1; d <= lastDay.getDate(); d++) {
        week.push(String(d))
        if (week.length === 7) {
            weeks.push(week)
            week = []
        }
    }
    // 最終週の残りを空欄で埋める
    if (week.length > 0) {
        while (week.length < 7) week.push('')
        weeks.push(week)
    }
    return weeks
}

export async function execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand()
    const userId = interaction.user.id
    const shifts = loadShifts()

    if (sub === 'add') {
        const date = interaction.options.getString('date', true)
        const start = interaction.options.getString('start', true)
        const end = interaction.options.getString('end', true)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            await interaction.reply('日付はYYYY-MM-DD形式で入力してください。')
            return
        }
        if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
            await interaction.reply('開始時刻・終了時刻はHH:MM形式で入力してください。')
            return
        }
        if (!shifts[userId]) shifts[userId] = {}
        shifts[userId][date] = `${start} - ${end}`
        saveShifts(shifts)
        await interaction.reply(`✅ ${date} のシフト「${start} - ${end}」を登録しました。`)
    } else if (sub === 'show') {
        // 年月取得
        const year = interaction.options.getInteger('year', true)
        const month = interaction.options.getInteger('month', true)
        const userShifts = shifts[userId]
        if (!userShifts || Object.keys(userShifts).length === 0) {
            await interaction.reply('登録されたシフトがありません。')
            return
        }
        const weeks = getMonthCalendar(year, month)
        const weekLabels = ['日', '月', '火', '水', '木', '金', '土']
        // 幅を揃える
        const cellWidth = 12
        const pad = (s: string) => s.padEnd(cellWidth, ' ')
        // ヘッダー
        let calendar = '| ' + weekLabels.map(w => pad(w)).join(' | ') + ' |\n'
        calendar += '|' + weekLabels.map(() => ':--:'.padEnd(cellWidth + 1, '-')).join('|') + '|\n'
        // 各週
        for (const week of weeks) {
            calendar += '|'
            for (let i = 0; i < 7; i++) {
                const day = week[i]
                let cell = ''
                if (day) {
                    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    cell = userShifts[dateStr] ? `${day} ${userShifts[dateStr]}` : day
                }
                calendar += ' ' + pad(cell) + ' |'
            }
            calendar += '\n'
        }
        const embed = new EmbedBuilder()
            .setTitle(`${interaction.user.username}さんの${year}年${month}月のシフト`)
            .setDescription('```markdown\n' + calendar + '```')
            .setColor(0x00bfff)
        await interaction.reply({ embeds: [embed] })
    } else if (sub === 'delete') {
        const date = interaction.options.getString('date', true)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            await interaction.reply('日付はYYYY-MM-DD形式で入力してください。')
            return
        }
        if (!shifts[userId] || !shifts[userId][date]) {
            await interaction.reply(`指定した日付（${date}）のシフトは登録されていません。`)
            return
        }
        delete shifts[userId][date]
        saveShifts(shifts)
        await interaction.reply(`🗑️ ${date} のシフトを削除しました。`)
    } else if (sub === 'edit') {
        const date = interaction.options.getString('date', true)
        const start = interaction.options.getString('start', true)
        const end = interaction.options.getString('end', true)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            await interaction.reply('日付はYYYY-MM-DD形式で入力してください。')
            return
        }
        if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
            await interaction.reply('開始時刻・終了時刻はHH:MM形式で入力してください。')
            return
        }
        if (!shifts[userId] || !shifts[userId][date]) {
            await interaction.reply(`指定した日付（${date}）のシフトは登録されていません。`)
            return
        }
        shifts[userId][date] = `${start} - ${end}`
        saveShifts(shifts)
        await interaction.reply(`✏️ ${date} のシフトを「${start} - ${end}」に編集しました。`)
    }
}