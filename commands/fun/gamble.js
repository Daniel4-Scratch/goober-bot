const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { connect, getCollection, close, isDatabaseOnline } = require('../../mongodb.js');

const buttons = {
    createAccountRow: new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('car_create')
            .setLabel('Create Account')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('car_cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary)
    ),
    existingUser: new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('eu_dice')
            .setLabel('Roll Dice')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('eu_cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary)
    )
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gamble')
        .setDescription('Spend your sons college fund on a gamble'),
    async execute(interaction) {
        const userId = interaction.user.id;
        await interaction.reply(`<a:load:1380119202911752222> Connecting to the database...`);
        //for debugging just check if userid exists in "gamble" collection in "goober-bot" database
        try {
            const db = await connect();
            if (!db) {
                return interaction.editReply('<:redcross:1380119177498464277> Database connection failed. Please try again later.');
            }

            const gambleCollection = getCollection('gamble');
            const user = await gambleCollection.findOne({ userId: String(userId) });


            if (!user) {
                // User does not exist, prompt to create an account
                return interaction.editReply({
                    content: 'You do not have a gambling account. Would you like to create one?',
                    components: [buttons.createAccountRow]
                });
            }else{
                // User exists, proceed with the gambling logic
                return interaction.editReply({
                    content: `Welcome home darling <a:monkey_straw:1338391460252483605>
                    Balance: ${user.balance} coins`.replace(/^[ \t]+/gm, ''),
                    components: [buttons.existingUser]
                });
            }

            // User exists, proceed with the gambling logic
            // (Add your gambling logic here)

        } catch (error) {
            console.error('Database error:', error);
            return interaction.editReply('<:redcross:1380119177498464277> An error occurred while connecting to the database.');
        } finally {
            await close(); // Ensure the database connection is closed after the operation
        }
    }
};

// Handle button interactions for creating an account
module.exports.handleButtonInteraction = async (interaction) => {
    // check if user was the one who initiated the command
    if (interaction.user.id !== interaction.message.interaction.user.id) {
        return await interaction.reply({
            content: 'Ts aint yours vro 😂👌',
            flags: MessageFlags.Ephemeral
        });
    }else{
        await interaction.update({
            content: '<a:load:1380119202911752222> Processing your request...',
            components: []
        });
        const db = await connect();
        if (!db) {
            return await interaction.editReply('<:redcross:1380119177498464277> Database connection failed. Please try again later.');
        }
        const gambleCollection = getCollection('gamble');
        const userId = interaction.user.id;
        const existingUser = await gambleCollection.findOne({ userId: String(userId) });
        const interArray = interaction.customId.split('_');
        if(interArray[0] == "car"){
            if(interArray[1] == "create"){
                await interaction.editReply({
                    content: '<a:load:1380119202911752222> Creating your gambling account...',
                    components: []
                });
                if (existingUser) {
                    return await interaction.editReply({
                        content: 'You already have a gambling account.',
                        components: []
                    });
                } else {
                    await gambleCollection.insertOne({
                        userId: String(userId),
                        balance: 1000 // Starting balance
                    });
                }
                return await interaction.editReply({
                    content: 'Your gambling account has been created! You start with 1000 coins.',
                    components: []
                });
            }
            if(interArray[1] == "cancel"){
                return await interaction.editReply({
                    content: 'Account creation cancelled.',
                    components: []
                });
            }
        } else if(interArray[0] == "eu"){
            if(interArray[1] == "dice"){
                return await interaction.editReply('ts not working yet vro');
            }else if(interArray[1] == "cancel"){
                return await interaction.editReply({
                    content: '99% of gamblers quit before they hit big',
                    components: []
                });
            }
        }
        await close(); // Ensure the database connection is closed after the operation
    }
}