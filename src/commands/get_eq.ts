import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'
import { fetch } from 'undici'

export const data = new SlashCommandBuilder()
    .setName('get_eq')
    .setDescription('直近に発表された地震情報を取得します（気象庁データ）')

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply()
    try {
        // 最新の地震リスト取得
        const res = await fetch('https://www.jma.go.jp/bosai/quake/data/list.json')
        const list = await res.json() as { json: string }[]
        if (!list.length) {
            await interaction.editReply('直近の地震情報が見つかりませんでした。')
            return
        }
        // 最新1件の詳細取得
        const latestId = list[0].json
        const detailRes = await fetch(`https://www.jma.go.jp/bosai/quake/data/${latestId}`)
        const detail = await detailRes.json() as any; // ←ここを修正

        // 必要な情報を抽出
        const time = detail.Head?.ReportDateTime ?? '不明'
        const hypocenter = detail.Body?.Earthquake?.Hypocenter?.Area?.Name ?? '不明'
        const magnitude = detail.Body?.Earthquake?.Magnitude ?? '不明'
        const maxScale = detail.Body?.Intensity?.Observation?.MaxInt ?? '不明'
        const lat = detail.Body?.Earthquake?.Hypocenter?.Latitude
        const lon = detail.Body?.Earthquake?.Hypocenter?.Longitude
        const mapUrl = (lat && lon)
            ? `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&z=6&size=450,300&l=map&pt=${lon},${lat},pm2rdm`
            : undefined

        const embed = new EmbedBuilder()
            .setTitle('直近の地震情報（気象庁）')
            .setDescription(
                `発生時刻: ${time}\n震源地: ${hypocenter}\nマグニチュード: ${magnitude}\n最大震度: ${maxScale}`
            )
            .setColor(0xff9900)
        if (mapUrl) embed.setImage(mapUrl)
        await interaction.editReply({ embeds: [embed] })
    } catch (e) {
        console.error(e)
        await interaction.editReply('地震情報の取得中にエラーが発生しました。')
    }
}