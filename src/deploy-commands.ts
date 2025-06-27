import { REST, Routes, SlashCommandBuilder } from 'discord.js'
import dotenv from 'dotenv'

dotenv.config()

const commands = [
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Botの応答速度を測定します。')
        .toJSON(),
    new SlashCommandBuilder()
        .setName('lottery')
        .setDescription('ランダムな抽選を行います。')
        .toJSON(),
]

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN as string)

async function main() {
    try {
        console.log('スラッシュコマンドを登録中...')
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID as string),
            { body: commands }
        )
        console.log('登録完了！')
    } catch (error) {
        console.error(error)
    }
}

main()