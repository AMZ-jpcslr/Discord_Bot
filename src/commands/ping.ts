import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js'

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('BotのPing値を返します')

export async function execute(interaction: ChatInputCommandInteraction) {
    const ping = interaction.client.ws.ping
    await interaction.reply(`現在のPing値: ${ping}ms`)
}