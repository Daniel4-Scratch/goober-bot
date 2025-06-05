const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('cat')
		.setDescription('Returns a random cat image'),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: false });
		const response = await fetch('https://api.thecatapi.com/v1/images/search');
		const data = await response.json();
		if (!data || !data[0] || !data[0].url) {
			return interaction.editReply('Could not fetch a cat image at this time.');
		}
		await interaction.editReply({ content: data[0].url, allowedMentions: { repliedUser: false } });
	},
};
