import { Client, TextChannel, EmbedBuilder } from 'discord.js'
import { fetch } from 'undici'
import fs from 'fs'
import path from 'path'

const DATA_PATH = path.join(__dirname, '../../data/eq_channels.json')

// 通知チャンネル設定をロード
function loadChannels(): Record<string, string> {
    if (!fs.existsSync(DATA_PATH)) return {}
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
}

// 直近の地震IDを保存して重複通知を防ぐ
const latestIdPath = path.join(__dirname, '../../data/latest_eq_id.txt')
function loadLatestId(): string | null {
    if (!fs.existsSync(latestIdPath)) return null
    return fs.readFileSync(latestIdPath, 'utf8').trim()
}
function saveLatestId(id: string) {
    fs.mkdirSync(path.dirname(latestIdPath), { recursive: true })
    fs.writeFileSync(latestIdPath, id, 'utf8')
}

// 定期的に気象庁APIを監視して新しい地震があれば通知
export function startEqAutoNotify(client: Client) {
    setInterval(async () => {
        try {
            const res = await fetch('https://www.jma.go.jp/bosai/quake/data/list.json')
            const list = await res.json() as { json: string }[]
            if (!list.length) return
            const latestId = list[0]?.json;
if (!latestId || typeof latestId !== 'string' || !latestId.endsWith('.json')) {
    console.warn('不正なlatestId:', latestId);
    return;
}
if (latestId === loadLatestId()) return; // すでに通知済み

const detailUrl = `https://www.jma.go.jp/bosai/quake/data/${latestId}`;
console.log('地震詳細取得URL:', detailUrl);
const detailRes = await fetch(detailUrl);
const detail = await detailRes.json() as any; // ← 型アサーションを追加

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
                .setTitle('【自動通知】地震情報（気象庁）')
                .setDescription(
                    `発生時刻: ${time}\n震源地: ${hypocenter}\nマグニチュード: ${magnitude}\n最大震度: ${maxScale}`
                )
                .setColor(0xff0000)
            if (mapUrl) embed.setImage(mapUrl)

            // 通知チャンネルへ送信
            const channels = loadChannels()
            for (const guildId in channels) {
                const channelId = channels[guildId]
                const guild = client.guilds.cache.get(guildId)
                if (!guild) continue
                const channel = guild.channels.cache.get(channelId) as TextChannel
                if (channel && channel.isTextBased()) {
                    channel.send({ embeds: [embed] })
                }
            }
            saveLatestId(latestId)
        } catch (e) {
            console.error('地震自動通知エラー:', e)
        }
    }, 60 * 1000) // 1分ごとにチェック
}