const { SlashCommandBuilder } = require('discord.js');

const OWNER_ID = '853820912628269088'; // Replace with your Discord user ID

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shutdown')
        .setDescription('Shuts down the bot (owner only)'),
    async execute(interaction) {
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({ content: 'In your dreams!', ephemeral: true });
        }
        await interaction.reply({content: 'Shutting down...', ephemeral: true});
        console.log('Shutting down the bot...');
        await interaction.client.destroy();
        process.exit(0);
    },
};