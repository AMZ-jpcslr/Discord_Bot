import { Client, GatewayIntentBits } from 'discord.js'

import * as pingCommand from './commands/ping'
import dotenv from 'dotenv'

dotenv.config()

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // これがないとメッセージ内容が取得できません
    ],
})

client.once('ready', () => {
    console.log('Ready!')
    if (client.user) {
        console.log(client.user.tag)
        client.user.setPresence({
            activities: [{ name: 'キヴォトスで業務中' }],
            status: 'online',
        })
    }
})


// ...コマンド登録処理...

//pingコマンドの登録
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return
    if (interaction.commandName === 'ping') {
        await pingCommand.execute(interaction)
    }
})

client.login(process.env.TOKEN)