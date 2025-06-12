const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
        .setName("random")
        .setDescription("Gets a random api response")
        .addStringOption(option =>
            option.setName("api")
                .setDescription("The API to use")
                .setRequired(true)
                .addChoices(
                    {name:"Cat Image", value:"cat"},
                    {name:"Dad Joke", value:"dad"},
                    {name:"Coffee", value:"coffee"}
        )),
	async execute(interaction) {
        const api = interaction.options.getString("api");
        await interaction.deferReply({ ephemeral: false });

        let url;
        if (api === "cat") {
            url = "https://api.thecatapi.com/v1/images/search";
        } else if (api === "dad") {
            url = "https://icanhazdadjoke.com/";
        }else if (api === "coffee") {
            url = "https://coffee.alexflipnote.dev/random.json";
        } else {
            return interaction.editReply("Invalid API selected.");
        }

        try {
            const response = await fetch(url, {
                headers: { "Accept": api === "dad" ? "application/json" : "application/json" }
            });
            const data = await response.json();
            if (api === "cat") {
                await interaction.editReply({ content: data[0].url, allowedMentions: { repliedUser: false } });
            } else if (api === "dad") {
                await interaction.editReply(data.joke);
            } else if (api === "coffee") {
                await interaction.editReply({ content: data.file, allowedMentions: { repliedUser: false } });
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply("An error occurred while fetching the data.");
        }
	},
};

