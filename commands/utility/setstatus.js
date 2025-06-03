// filepath: [setstatus.js](http://_vscodecontentref_/0)
const { SlashCommandBuilder } = require('discord.js');

const OWNER_ID = '853820912628269088'; // Replace with your Discord user ID

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setstatus')
        .setDescription('Set the bot status (owner only)')
        .addStringOption(option =>
            option.setName('status')
                .setDescription('The status to set')
                .setRequired(true)
        ),
    async execute(interaction) {
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }
        const status = interaction.options.getString('status');
        try {
            await interaction.client.user.setPresence({
                activities: [{ name: status }],
                status: 'online',
            });
            await interaction.reply(`Status set to: ${status}`);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Failed to set status.', ephemeral: true });
        }
    },
};