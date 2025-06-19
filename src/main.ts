import { Client, GatewayIntentBits, Message, TextChannel } from 'discord.js'
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

client.on('messageCreate', async (message: Message) => {
    if (message.author.bot) return
    if (message.content.startsWith('!ping')) {
        if (message.channel instanceof TextChannel) {
            await message.channel.send('Pong!')
        }
    }
})

client.login(process.env.TOKEN)