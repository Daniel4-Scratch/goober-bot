const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('cat')
		.setDescription('Returns a random cat image'),
	async execute(interaction) {
		const response = await fetch('https://api.thecatapi.com/v1/images/search');
		const data = await response.json();
		if (!data || !data[0] || !data[0].url) {
			return interaction.reply('Could not fetch a cat image at this time.');
		}
		await interaction.reply({ content: data[0].url, allowedMentions: { repliedUser: false } });
	},
};
