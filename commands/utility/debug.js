const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

const OWNER_ID = '853820912628269088';
const environment = process.env.environment || 'development_localhost';

const buttons = {
	main: new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId('debug_main_shutdown')
			.setLabel('Shutdown')
			.setStyle(ButtonStyle.Danger)
	)
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('debug')
		.setDescription('Runtime information'),
	async execute(interaction) {
		if (interaction.user.id !== OWNER_ID){
			return await interaction.reply({ content: 'u wish'});
		}
		await interaction.reply({
            content: `\`\`\`Environment: ${environment}\nNode.js Version: ${process.version}\nDiscord.js Version: ${require('discord.js').version}\nProcess ID: ${process.pid}\nUptime: ${Math.floor(process.uptime())} seconds\nMemory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB\`\`\``,
            ephemeral: true,
			components: [buttons.main]
        });
	},
};

module.exports.canHandle = (interaction) => {
    // Check if the interaction is a button interaction
    return interaction.isButton() && (interaction.customId.startsWith('debug_'));
}

module.exports.handleButtonInteraction = async (interaction) => {
	if (interaction.customId === 'debug_main_shutdown') {
		if (interaction.user.id !== OWNER_ID) {
			return await interaction.reply({ content: 'u wish', ephemeral: true });
		}
		await interaction.reply({ content: 'Shutting down...', ephemeral: true });
		console.log('Shutting down...');
		process.exit(0);
	}
};