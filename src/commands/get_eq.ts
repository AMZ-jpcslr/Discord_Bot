import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'

export const data = new SlashCommandBuilder()
    .setName('get_eq')
    .setDescription('直近に発表された地震情報を取得します（気象庁データ）')

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply()
    try {
        const res = await fetch('https://www.jma.go.jp/bosai/quake/data/list.json')
        const list = await res.json() as { json: string }[]
        if (!list.length) {
            await interaction.editReply('直近の地震情報が見つかりませんでした。')
            return
        }
        const latestId = list[0].json
        const imageUrl = latestId.replace('.json', '.png'); // 例: 20240630012345.json → 20240630012345.png
        const jmaImageUrl = `https://www.jma.go.jp/bosai/quake/data/${imageUrl}`;

        const detailRes = await fetch(`https://www.jma.go.jp/bosai/quake/data/${latestId}`)
        const detail = await detailRes.json() as any

        const time = detail.Head?.ReportDateTime ?? '不明'
        const hypocenter = detail.Body?.Earthquake?.Hypocenter?.Area?.Name ?? '不明'
        const magnitude = detail.Body?.Earthquake?.Magnitude ?? '不明'
        const maxScale = detail.Body?.Intensity?.Observation?.MaxInt ?? '不明'
        const hypocenterObj = detail.Body?.Earthquake?.Hypocenter;
        console.log('Hypocenter:', hypocenterObj);

        let lat: string | undefined, lon: string | undefined;
        const coordinate = hypocenterObj?.Area?.Coordinate;
        if (coordinate) {
            const match = coordinate.match(/([+-]\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)/);
            if (match) {
                lat = match[1];
                lon = match[2];
            }
        }
        const cleanLat = lat?.replace('+', '');
        const cleanLon = lon?.replace('+', '');
        // GEOAPIFY_API_KEY を自分のものに置き換えてください
        const GEOAPIFY_API_KEY = 'e696a7e617a747b6a83c3f127c355253';
        const mapUrl = (cleanLat && cleanLon)
            ? `https://maps.geoapify.com/v1/staticmap?style=osm-carto&width=450&height=300&center=lonlat:${cleanLon},${cleanLat}&zoom=6&marker=lonlat:${cleanLon},${cleanLat};color:%23ff0000;size:large&apiKey=${GEOAPIFY_API_KEY}`
            : undefined;

        console.log('lat:', cleanLat, 'lon:', cleanLon, 'mapUrl:', mapUrl);

        const embed = new EmbedBuilder()
            .setTitle('直近の地震情報（気象庁）')
            .setDescription(
                `発生時刻: ${time}\n震源地: ${hypocenter}\nマグニチュード: ${magnitude}\n最大震度: ${maxScale}`
            )
            .setColor(0xff9900)
            .setImage(jmaImageUrl); // ←ここで公式画像を表示

        await interaction.editReply({ embeds: [embed] })
    } catch (e) {
        console.error(e)
        await interaction.editReply('地震情報の取得中にエラーが発生しました。')
    }
}