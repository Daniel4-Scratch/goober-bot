const { SlashCommandBuilder } = require('discord.js');

const RUBBER_ROOM_CHANNEL_ID = '1267563039641833525'; // Replace with your preset channel ID

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rubberroom')
        .setDescription('Send a user to the rubber room (move them to a preset voice channel)')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to send')
                .setRequired(true)
        ),
    async execute(interaction) {
        const member = interaction.options.getMember('target');
        const channel = interaction.guild.channels.cache.get(RUBBER_ROOM_CHANNEL_ID);

        if (!channel || channel.type !== 2) { // 2 = GUILD_VOICE
            return interaction.reply({ content: 'Rubber room channel not found or is not a voice channel.', ephemeral: true });
        }

        if (!member.voice.channel) {
            return interaction.reply({ content: 'That user is not in a voice channel.', ephemeral: true });
        }

        try {
            await member.voice.setChannel(channel);
            await interaction.reply({ content: `${member.user.tag} has been sent to the rubber room!` });
        } catch (error) {
            await interaction.reply({ content: 'Failed to move the user. Do I have the right permissions?', ephemeral: true });
        }
    },
};