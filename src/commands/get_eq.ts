import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'
// node-fetchのESM対応: applyを使わず直接引数を渡す
const fetch: any = (...args: any[]) =>
    import('node-fetch').then(mod => mod.default(args[0], args[1]));

export const data = new SlashCommandBuilder()
    .setName('get_eq')
    .setDescription('直近に発表された地震情報を取得します')

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply()
    try {
        const res = await fetch('https://api.p2pquake.net/v2/history?codes=551,554,561,565&limit=1')
        const json = await res.json() as any[]
        if (!json.length) {
            await interaction.editReply('直近の地震情報が見つかりませんでした。')
            return
        }
        const eq = json[0]
        const { time, hypocenter, magnitude, maxScale } = eq
        const lat = hypocenter?.latitude
        const lon = hypocenter?.longitude
        const place = hypocenter?.name || '不明'
        const mapUrl = (lat && lon)
            ? `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&z=6&size=450,300&l=map&pt=${lon},${lat},pm2rdm`
            : undefined

        const embed = new EmbedBuilder()
            .setTitle('直近の地震情報')
            .setDescription(
                `発生時刻: ${time}\n震源地: ${place}\nマグニチュード: ${magnitude ?? '不明'}\n最大震度: ${maxScale ?? '不明'}`
            )
            .setColor(0xff9900)
        if (mapUrl) embed.setImage(mapUrl)
        await interaction.editReply({ embeds: [embed] })
    } catch (e) {
        await interaction.editReply('地震情報の取得中にエラーが発生しました。')
    }
}