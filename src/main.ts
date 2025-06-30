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
            const lat = hypocenter.latitude
            const lon = hypocenter.longitude
            const place = hypocenter.name
            // 地図画像URL例（OpenStreetMap Static）
            const mapUrl = `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&z=6&size=450,300&l=map&pt=${lon},${lat},pm2rdm`
            const embed = new EmbedBuilder()
                .setTitle('【緊急地震速報】')
                .setDescription(`震源地: ${place}\nマグニチュード: ${magnitude}\n最大震度: ${maxScale}\n発生時刻: ${time}`)
                .setImage(mapUrl)
                .setColor(0xff0000)
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