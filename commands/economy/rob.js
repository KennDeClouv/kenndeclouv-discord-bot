const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../database/models/User");
const Inventory = require("../../database/models/inventory");
const config = require("../../config");
const checkCooldown = require("../../helpers/checkCooldown");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rob")
    .setDescription("Coba mencuri uang dari pengguna lain.")
    .addUserOption((option) => option.setName("target").setDescription("Pengguna yang ingin anda mencuri").setRequired(true)),
  async execute(interaction) {
    const targetUser = interaction.options.getUser("target");
    if (targetUser.id === interaction.user.id) {
      return interaction.reply({ content: `❌ | kamu tidak dapat mencuri diri sendiri!`, ephemeral: true });
    }

    const user = await User.findOne({
      where: { userId: interaction.user.id },
    });
    const target = await User.findOne({
      where: { userId: targetUser.id },
    });

    if (!user || !target) {
      return interaction.reply({ content: `❌ | Entah kamu atau target tidak memiliki akun!`, ephemeral: true });
    }

    // Cooldown check
    // const cooldown = checkCooldown(user.lastRob, config.cooldowns.rob);
    // if (cooldown.remaining) {
    //   return interaction.reply({ content: `🕒 | kamu dapat mencuri lagi dalam **${cooldown.time}**!`, ephemeral: true });
    // }

    const shield = await Inventory.findOne({ where: { userId: target.userId, itemName: "🛡️ Shield" } });
    let poison = null;
    if (!shield) {
      poison = await Inventory.findOne({ where: { userId: target.userId, itemName: "🧪 Poison" } });
    }

    // Randomize the success chance
    let success = false;
    if (shield) {
      success = false;
      await shield.destroy(); // Destroy the shield item after use
    } else if (poison) {
      success = Math.random() < 0.1; // 10% chance of success
    } else {
      success = Math.random() < 0.3; // 30% chance of success
    }

    const robAmount = Math.floor(Math.random() * 201) + 50;

    if (success) {
      // Successful rob
      if (target.cash < robAmount) {
        return interaction.reply({ content: `❌ | Target tidak memiliki uang yang cukup!`, ephemeral: true });
      }

      user.cash += robAmount;
      target.cash -= robAmount;
      user.lastRob = new Date();
      await user.save();
      await target.save();

      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("> Hasil Mencuri")
        .setThumbnail(interaction.user.displayAvatarURL())
        .setDescription(`kamu berhasil mencuri **${robAmount} uang** dari **${targetUser.username}**!`)
        .setTimestamp()
        .setFooter({ text: `sistem`, iconURL: interaction.guild.iconURL() });
      await interaction.reply({ embeds: [embed], ephemeral: true });

      const embedToTarget = new EmbedBuilder()
        .setColor("Red")
        .setTitle("> Kamu dicuri!")
        .setThumbnail(interaction.user.displayAvatarURL())
        .setDescription(`**${interaction.user.username}** mencuri **${robAmount} uang** dari kamu!`)
        .setTimestamp()
        .setFooter({ text: `sistem`, iconURL: interaction.guild.iconURL() });
      await targetUser.send({ embeds: [embedToTarget] });
    } else {
      // Failed rob, pay the target
      if (user.cash < robAmount) {
        return interaction.reply({ content: `❌ | kamu tidak memiliki uang yang cukup untuk membayar jika mencuri gagal!`, ephemeral: true });
      }
      if (poison) {
        const penalty = user.cash;
        user.cash -= penalty;
        target.cash += penalty;
        await poison.destroy(); // Destroy poison item after use
      } else {
        user.cash -= robAmount;
        target.cash += robAmount;
      }

      user.lastRob = new Date();
      await user.save();
      await target.save();

      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("> Hasil Mencuri")
        .setThumbnail(interaction.user.displayAvatarURL())
        .setDescription(`❌ | kamu gagal mencuri dari **${targetUser.username}** dan membayar mereka **${poison ? "semua uang kamu" : robAmount + " uang" }** sebagai denda. ${shield ? "Karena target memiliki shield" : ""} ${poison ? "Karena target memiliki poison" : ""}`)
        .setTimestamp()
        .setFooter({ text: `sistem`, iconURL: interaction.guild.iconURL() });
      await interaction.reply({ embeds: [embed], ephemeral: true });

      const embedToTarget = new EmbedBuilder()
        .setColor("Green")
        .setTitle("> Hasil Mencuri")
        .setThumbnail(interaction.user.displayAvatarURL())
        .setDescription(`**${interaction.user.username}** berusaha mencuri **${robAmount} uang** dari kamu! tapi gagal dan membayar kamu **${poison ? penalty : robAmount  } uang** sebagai denda. ${shield ? "Karena target kamu memiliki shield" : ""} ${poison ? "Karena target kamu memiliki poison" : ""}`)
        .setTimestamp()
        .setFooter({ text: `sistem`, iconURL: interaction.guild.iconURL() });
      await targetUser.send({ embeds: [embedToTarget] });
    }
  },
};