const { SlashCommandBuilder } = require("discord.js");
const checkPermission = require("../../helpers/checkPermission");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Mutes a user in a voice channel.")
    .addUserOption((option) => option.setName("user").setDescription("User to mute").setRequired(true)),
  async execute(interaction) {
    if (!checkPermission(interaction.member)) {
      return interaction.reply({ content: "❌ Kamu tidak punya izin untuk menggunakan perintah ini.", ephemeral: true });
    }
    const user = interaction.options.getUser("user");

    if (!interaction.member.permissions.has("MUTE_MEMBERS")) {
      return interaction.reply({ content: "You do not have permission to mute members.", ephemeral: true });
    }

    const member = await interaction.guild.members.fetch(user.id);

    if (member) {
      await member.voice.setMute(true, "Muted by command.");
      return interaction.reply(`🔇 | Muted **${user.tag}**.`);
    } else {
      return interaction.reply({ content: "That user is not in this server!", ephemeral: true });
    }
  },
};
