import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js'

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Pong!と返します')

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply('Pong!')
}