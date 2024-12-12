const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../database/models/User");
const config = require("../../config");
const checkCooldown = require("../../helpers/checkCooldown");

module.exports = {
  data: new SlashCommandBuilder().setName("beg").setDescription("Minta uang dari pengguna lain."),
  async execute(interaction) {
    let user = await User.findOne({
      where: { userId: interaction.user.id },
    });
    if (!user) {
      return interaction.reply({ content: 'kamu belum memiliki akun gunakan `/account create` untuk membuat akun.', ephemeral: true });
    }

    // Cooldown check
    const cooldown = checkCooldown(user.lastBeg, config.cooldowns.beg);
    if (cooldown.remaining) {
      return interaction.reply({ content: `🕒 | kamu dapat meminta uang lagi dalam **${cooldown.time}**!`, ephemeral: true });
    }

    // Randomize beg amount between 10 and 50
    const randomCash = Math.floor(Math.random() * 41) + 10;
    user.cash += randomCash;
    user.lastBeg = Date.now();
    await user.save();

    const embed = new EmbedBuilder()
      .setColor("Yellow")
      .setTitle("> Hasil Meminta")
      .setThumbnail(interaction.user.displayAvatarURL())
      .setDescription(`kamu meminta dan menerima **${randomCash} uang**!`)
      .setTimestamp()
      .setFooter({ text: `Diminta oleh ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};