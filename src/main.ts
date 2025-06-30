import { Client, GatewayIntentBits } from 'discord.js'
import * as pingCommand from './commands/ping'
import * as lotteryCommand from './commands/lottery' // ←追加
import * as shiftCommand from './commands/shift'
import * as setEqChannelCommand from './commands/set_eq_channel'
import * as getEqCommand from './commands/get_eq'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { EmbedBuilder, TextChannel } from 'discord.js'
import WebSocket from 'ws'
import { startEqAutoNotify } from './eq_notify'

dotenv.config()

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        // GatewayIntentBits.MessageContent, 
    ],
})

function setBotPresence() {
    if (client.user) {
        client.user.setPresence({
            activities: [{ name: 'キヴォトスの最新情報', type: 1 }],
            status: 'online',
        })
    }
}

client.once('ready', () => {
    console.log('Ready!')
    if (client.user) {
        console.log(client.user.tag)
    }
    setBotPresence()

    // 5分ごとにPing値とサーバー数をターミナルに出力
    setInterval(() => {
        const ping = client.ws.ping
        const guildCount = client.guilds.cache.size
        console.log(`Bot起動中！Ping: ${ping}ms / サーバー数: ${guildCount}`)
    }, 5 * 60 * 1000) // 5分ごと（ミリ秒に修正）

    startEqAutoNotify(client)
})

// 再接続時にもステータスを再設定
client.on('shardResume', () => {
    setBotPresence()
})


//コマンドの登録
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return
    if (interaction.commandName === 'ping') {
        await pingCommand.execute(interaction)
    }
    if (interaction.commandName === 'lottery') {
        await lotteryCommand.execute(interaction)
    }
    if (interaction.commandName === 'shift') {
        await shiftCommand.execute(interaction)
    }
    if (interaction.commandName === 'set_eq_channel') {
        await setEqChannelCommand.execute(interaction)
    }
    if (interaction.commandName === 'get_eq') {
        await getEqCommand.execute(interaction)
    }
})

client.login(process.env.TOKEN)

// 緊急地震速報の受信（例: P2P地震情報 WebSocket）
const ws = new WebSocket('wss://api.p2pquake.net/v2/ws')

ws.on('message', async (data) => {
    try {
        const json = JSON.parse(data.toString())
        if (json.code === 551) { // 緊急地震速報
            const { hypocenter, magnitude, maxScale, time } = json
            const lat = hypocenter?.latitude
            const lon = hypocenter?.longitude
            const place = hypocenter?.name ?? '不明'

            // 震度画像URL（例: 気象庁風アイコン。自作やフリー素材を使う場合はURLを差し替えてください）
            // ここでは例として「震度5強」のアイコン画像URLを使用
            // 震度ごとに画像を切り替えたい場合はmaxScaleの値で分岐してください
            let shindoImageUrl: string | undefined = undefined
            switch (maxScale) {
                case 10: shindoImageUrl = 'https://raw.githubusercontent.com/AMZ-jpcslr/Discord_Bot/refs/heads/master/nc300018.jpg?token=GHSAT0AAAAAADGG2T7ANXQR6SRXJKIUTDQ62DCVRBQ'; break
                case 20: shindoImageUrl = 'https://raw.githubusercontent.com/AMZ-jpcslr/Discord_Bot/refs/heads/master/nc300017.jpg?token=GHSAT0AAAAAADGG2T7ABGGNE7PURHBWO7N22DCVRMA'; break
                case 30: shindoImageUrl = 'https://raw.githubusercontent.com/AMZ-jpcslr/Discord_Bot/refs/heads/master/nc300015.jpg?token=GHSAT0AAAAAADGG2T7BGJGHXRXF2NPM7QGM2DCVRTA'; break
                case 40: shindoImageUrl = 'https://raw.githubusercontent.com/AMZ-jpcslr/Discord_Bot/refs/heads/master/nc300014.jpg?token=GHSAT0AAAAAADGG2T7AYHOQV3DSPQJVTHEI2DCVRYA'; break
                case 45: shindoImageUrl = 'https://raw.githubusercontent.com/AMZ-jpcslr/Discord_Bot/refs/heads/master/nc300013.jpg?token=GHSAT0AAAAAADGG2T7BCGAFRP6G7WWO4QJE2DCVR5Q'; break
                case 50: shindoImageUrl = 'https://raw.githubusercontent.com/AMZ-jpcslr/Discord_Bot/refs/heads/master/nc300012.jpg?token=GHSAT0AAAAAADGG2T7ARIE3GAFKN3WKEW7Q2DCVSCQ'; break
                case 55: shindoImageUrl = 'https://raw.githubusercontent.com/AMZ-jpcslr/Discord_Bot/refs/heads/master/nc300011.jpg?token=GHSAT0AAAAAADGG2T7AHK5SONZC2LCATADQ2DCVSIQ'; break
                case 60: shindoImageUrl = 'https://raw.githubusercontent.com/AMZ-jpcslr/Discord_Bot/refs/heads/master/nc300010.jpg?token=GHSAT0AAAAAADGG2T7BW2EDUOE5JTYUSIRK2DCVSPQ'; break
                case 70: shindoImageUrl = 'https://raw.githubusercontent.com/AMZ-jpcslr/Discord_Bot/refs/heads/master/nc300009.jpg?token=GHSAT0AAAAAADGG2T7BE45YPOH6PMH45LNC2DCVSUA'; break
                default: shindoImageUrl = undefined
            }

            // 地図画像
            let mapUrl: string | undefined = undefined
            if (lat && lon) {
                mapUrl = `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&z=6&size=450,300&l=map&pt=${lon},${lat},pm2rdm`
            }

            // Embed作成
            const embed = new EmbedBuilder()
                .setTitle('【緊急地震速報】')
                .setColor(0xff0000)
                .setDescription(
                    `**震源地**: ${place}\n` +
                    `**発生時刻**: ${time}\n` +
                    `**マグニチュード**: ${magnitude}\n` +
                    `**最大震度**: ${maxScale !== undefined ? maxScaleToString(maxScale) : '不明'}`
                )

            // 震度画像をサムネイルに
            if (shindoImageUrl) {
                embed.setThumbnail(shindoImageUrl)
            }
            // 地図画像を埋め込み画像に
            if (mapUrl) {
                embed.setImage(mapUrl)
            }

            // 通知チャンネル取得
            const channelsPath = path.join(__dirname, '../data/eq_channels.json')
            if (!fs.existsSync(channelsPath)) return
            const channels = JSON.parse(fs.readFileSync(channelsPath, 'utf8'))
            for (const guildId in channels) {
                const channelId = channels[guildId]
                const guild = client.guilds.cache.get(guildId)
                if (!guild) continue
                const channel = guild.channels.cache.get(channelId) as TextChannel
                if (channel && channel.isTextBased()) {
                    channel.send({ embeds: [embed] })
                }
            }
        }
    } catch (e) {
        console.error('地震速報通知エラー:', e)
    }
})

// 震度コードを日本語表記に変換する関数
function maxScaleToString(maxScale: number): string {
    switch (maxScale) {
        case 10: return '1'
        case 20: return '2'
        case 30: return '3'
        case 40: return '4'
        case 45: return '5弱'
        case 50: return '5強'
        case 55: return '6弱'
        case 60: return '6強'
        case 70: return '7'
        default: return String(maxScale)
    }
}