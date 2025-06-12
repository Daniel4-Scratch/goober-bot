const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { Double } = require('mongodb');
const { connect, getCollection, close, isDatabaseOnline } = require('../../mongodb.js');

const exitQuotes = [
    "99% of gamblers quit before they hit big",
    "The only way to win is to go all in",
    "You can't win if you don't play",
    "Winning isn't everything, it's the only thing"
];

const buttons = {
    createAccountRow: new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('gamble_car_create')
            .setLabel('Create Account')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('gamble_car_cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary)
    ),
    existingUser: new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('gamble_eu_slots')
            .setLabel('Roll Slots (100 coins)')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('gamble_eu_loan')
            .setLabel('Take a Loan')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('gamble_eu_payLoan')
            .setLabel('Pay Loan')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('gamble_eu_cancel')
            .setLabel('Exit')
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
                    🟩 Balance: ${user.balance} coins
                    🟥 Owed: ${user.owed} coins`.replace(/^[ \t]+/gm, ''),
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

module.exports.canHandle = (interaction) => {
    // Check if the interaction is a button interaction
    return interaction.isButton() && (interaction.customId.startsWith('gamble_'));
}

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
        interArray.shift();
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
                        balance: new Double(1000), // Starting balance as Double
                        owed: new Double(0),
                        lastLoan: new Double(Date.now())
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
            if(interArray[1] == "slots"){
                // 1 out of 6 chance to win, if you win you get double your bet
                const betAmount = 100; // Example bet amount
                if (!existingUser) {
                    return await interaction.editReply({
                        content: 'You do not have a gambling account. Please create one first.',
                        components: [buttons.createAccountRow]
                    });
                }
                if (existingUser.balance < betAmount) {
                    return await interaction.editReply({
                        content: 'You do not have enough balance to place this bet.',
                        components: [buttons.existingUser]
                    });
                }
                const roll = Math.floor(Math.random() * 3) + 1; // Roll a dice (1-3)
                if (roll === 1) {
                    // User wins
                    existingUser.balance += new Double(betAmount*2);
                    await gambleCollection.updateOne({ userId: String(userId) }, { $set: { balance: existingUser.balance } });
                    return await interaction.editReply({
                        content: `You won! Your new balance is ${existingUser.balance} coins.`,
                        components: [buttons.existingUser]
                    });
                } else {
                    // User loses
                    existingUser.balance -= new Double(betAmount);
                    await gambleCollection.updateOne({ userId: String(userId) }, { $set: { balance: existingUser.balance } });
                    return await interaction.editReply({
                        content: `You lost. Your new balance is ${existingUser.balance} coins.`,
                        components: [buttons.existingUser]
                    });
                }
            }else if(interArray[1] == "loan"){
                const timeNow = Date.now();
                existingUser.lastLoan = existingUser.lastLoan;
                const lastLoanHours = Math.floor((timeNow - existingUser.lastLoan) / (1000 * 60 * 60));
                if (lastLoanHours <= 1){
                    return await interaction.editReply({
                        content: `You can only take a loan once every hour. Please wait ${1 - lastLoanHours} hour(s) before taking another loan.`,
                        components: [buttons.existingUser]
                    });
                }else{
                    const loanAmount = 500; // Example loan amount
                    existingUser.balance += new Double(loanAmount);
                    existingUser.owed += new Double(loanAmount * 1.1); // 10% interest
                    existingUser.lastLoan = timeNow;
                    await gambleCollection.updateOne({ userId: String(userId) }, { $set: { balance: existingUser.balance, owed: existingUser.owed, lastLoan: existingUser.lastLoan } });
                    return await interaction.editReply({
                        content: `You took a loan of ${loanAmount} coins. Your new balance is ${existingUser.balance} coins and you owe ${existingUser.owed} coins.`,
                        components: [buttons.existingUser]
                    });
                }
            }else if(interArray[1] == "payLoan"){
                const payAmount = 100; // Example payment amount
                if (!existingUser) {
                    return await interaction.editReply({
                        content: 'You do not have a gambling account. Please create one first.',
                        components: [buttons.createAccountRow]
                    });
                }
                if (existingUser.owed <= 0) {
                    return await interaction.editReply({
                        content: 'You do not owe any money.',
                        components: [buttons.existingUser]
                    });
                }
                if (existingUser.balance < payAmount) {
                    return await interaction.editReply({
                        content: 'You do not have enough balance to make this payment.',
                        components: [buttons.existingUser]
                    });
                }
                existingUser.balance -= new Double(payAmount);
                existingUser.owed -= new Double(payAmount);
                await gambleCollection.updateOne({ userId: String(userId) }, { $set: { balance: existingUser.balance, owed: existingUser.owed } });
                return await interaction.editReply({
                    content: `You paid ${payAmount} coins towards your debt. Your new balance is ${existingUser.balance} coins and you owe ${existingUser.owed} coins.`,
                    components: [buttons.existingUser]
                }); 
            }
            else if(interArray[1] == "cancel"){
                return await interaction.editReply({
                    content: exitQuotes[Math.floor(Math.random() * exitQuotes.length)],
                    components: []
                });
            }
        }
        await close(); // Ensure the database connection is closed after the operation
    }
}