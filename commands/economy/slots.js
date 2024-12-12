const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/User');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Mainkan mesin slot dan coba keberuntungan anda.')
    .addIntegerOption(option => option.setName('bet').setDescription('Jumlah untuk bertaruh').setRequired(true)),
  async execute(interaction) {
    const bet = interaction.options.getInteger('bet');
    const user = await User.findOne({ 
        where: { userId: interaction.user.id } 
      });

    if (!user || user.cash < bet) {
      return interaction.reply({ content: 'kamu tidak memiliki uang yang cukup untuk bertaruh!', ephemeral: true });
    }

    const slotResults = ['🍒', '🍋', '🍊'];
    const roll = Array(3).fill().map(() => slotResults[Math.floor(Math.random() * slotResults.length)]);

    if (roll.every(symbol => symbol === roll[0])) {
      user.cash += bet * 3; // Triple win
      await user.save();

      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("> Hasil Bermain Slot")
        .setThumbnail(interaction.user.displayAvatarURL())
        .setDescription(`${interaction.user.username} menang! **${roll.join(' | ')}** ${interaction.user.username} tripled taruhan ${interaction.user.username} dan mendapatkan **${bet * 3} uang**!`)
        .setTimestamp()
        .setFooter({ text: `Diminta oleh ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
      return interaction.reply({ embeds: [embed]});
    } else {
      user.cash -= bet; // Lose the bet
      await user.save();

      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("> Hasil Bermain Slot")
        .setThumbnail(interaction.user.displayAvatarURL())
        .setDescription(`❌ | ${interaction.user.username} kalah! **${roll.join(' | ')}** kamu kehilangan **${bet} uang**.`)
        .setTimestamp()
        .setFooter({ text: `Diminta oleh ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
      return interaction.reply({ embeds: [embed]});
    }
  }
};
