const { SlashCommandBuilder } = require('discord.js');

const environment = process.env.environment || 'development_localhost';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('debug')
		.setDescription('Runtime information'),
	async execute(interaction) {
		await interaction.reply(`\`\`\`Environment: ${environment}\nNode.js Version: ${process.version}\nDiscord.js Version: ${require('discord.js').version}\nProcess ID: ${process.pid}\nUptime: ${Math.floor(process.uptime())} seconds\nMemory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB\`\`\``);
	},
};