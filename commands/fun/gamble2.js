const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { Double } = require('mongodb');
const { connect, getCollection, close, isDatabaseOnline } = require('../../mongodb.js');

const exitQuotes = [
    "99% of gamblers quit before they hit big",
    "The only way to win is to go all in",
    "You can't win if you don't play",
    "Winning isn't everything, it's the only thing"
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gamble')
        .setDescription('Spend your sons college fund on a gamble')
        .addSubcommand(subcommand =>subcommand
            .setName('spin')
            .setDescription('Spin slots')
            .addIntegerOption(option => option
                .setName('bet')
                .setDescription('The amount of coins to bet')
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand => subcommand
            .setName('pay-loan')
            .setDescription('Pay off your loan')
            .addIntegerOption(option => option
                .setName('amount')
                .setDescription('The amount of coins to pay off')
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand => subcommand
            .setName('stats')
            .setDescription('View your or others crippling financial state')
            .addUserOption(option => option
                .setName('user')
                .setDescription('The user to view stats for')
                .setRequired(false)
            )
        ),
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
            const existingUser = await gambleCollection.findOne({ userId: String(userId) });


            if (!existingUser) {
                // User does not exist, prompt to create an account
                return interaction.editReply({
                    content: 'You do not have a gambling account.'
                });
            } else {
                if (interaction.options.getSubcommand() == 'spin') {
                    const betAmount = interaction.options.getInteger('bet');
                    if (betAmount <= 0) {
                        return await interaction.editReply({
                            content: 'You must bet a positive amount of coins.',
                            components: []
                        });
                    }
                    if (betAmount > existingUser.balance) {
                        return await interaction.editReply({
                            content: `You do not have enough balance to place this bet. Your balance: ${existingUser.balance} coins.`,
                            components: []
                        });
                    }
                    const roll = Math.floor(Math.random() * 3) + 1; // Roll a dice (1-3)
                    if (roll === 1) {
                        // User wins
                        existingUser.balance += new Double(betAmount*2);
                        await gambleCollection.updateOne({ userId: String(userId) }, { $set: { balance: new Double(existingUser.balance) } });
                        return await interaction.editReply({
                            content: `You won! Your new balance is ${existingUser.balance} coins.`,
                            components: []
                        });
                    } else {
                        // User loses
                        existingUser.balance -= new Double(betAmount);
                        await gambleCollection.updateOne({ userId: String(userId) }, { $set: { balance: new Double(existingUser.balance) } });
                        return await interaction.editReply({
                            content: `You lost. Your new balance is ${existingUser.balance} coins.`,
                            components: []
                        });
                    }
                }else if(interaction.options.getSubcommand() == 'pay-loan'){
                    const payAmount = interaction.options.getInteger('amount'); // Example payment amount
                    if (!existingUser) {
                        return await interaction.editReply({
                            content: 'You do not have a gambling account. Please create one first.',
                            components: []
                        });
                    }
                    if (existingUser.owed <= 0) {
                        return await interaction.editReply({
                            content: 'You do not owe any money.',
                            components: []
                        });
                    }
                    if (existingUser.balance < payAmount) {
                        return await interaction.editReply({
                            content: 'You do not have enough balance to make this payment.',
                            components: []
                        });
                    }
                    existingUser.balance -= new Double(payAmount);
                    existingUser.owed -= new Double(payAmount);
                    await gambleCollection.updateOne({ userId: String(userId) }, { $set: { balance: new Double(existingUser.balance), owed: new Double(existingUser.owed) } });
                    return await interaction.editReply({
                        content: `You paid ${payAmount} coins towards your debt. Your new balance is ${existingUser.balance} coins and you owe ${existingUser.owed} coins.`,
                        components: []
                    });
                }else if(interaction.options.getSubcommand() == 'stats') {
                    let targetUserId = interaction.user.id; // Default to the command user
                    if (interaction.options.getUser('user')) {
                        // Fetch stats for the specified user
                        targetUserId = interaction.options.getUser('user').id;
                    }
                    const targetUser = await gambleCollection.findOne({ userId: String(targetUserId) });
                    if (!targetUser) {
                        return await interaction.editReply({
                            content: 'This user does not have a gambling account.',
                            components: []
                        });
                    }
                        const quote = exitQuotes[Math.floor(Math.random() * exitQuotes.length)];
                        return interaction.editReply({
                            content: `Here are the stats for <@${targetUserId}> <a:monkey_straw:1338391460252483605>
                            🟩 Balance: ${targetUser.balance} coins
                            🟥 Owed: ${targetUser.owed} coins
                            "Remember: ${quote}"`.replace(/^[ \t]+/gm, ''),
                            allowedMentions: { users: [] }
                        });
                    }
            }
            // End of user existence check

        } catch (error) {
            console.error('Database error:', error);
            return interaction.editReply('<:redcross:1380119177498464277> An error occurred while connecting to the database.');
        } finally {
            await close(); // Ensure the database connection is closed after the operation
        }
    }
};

module.exports.canHandle = (interaction) => {
    // Check if the interaction is a button interaction
    return interaction.isButton() && (interaction.customId.startsWith('gamble_'));
}