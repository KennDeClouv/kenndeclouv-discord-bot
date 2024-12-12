const { addXp } = require("./system/leveling"); // Mengimpor addXp dari leveling.js
const AutoMod = require("./database/models/automod"); // Model AutoMod

const cooldown = new Set(); // Set untuk memonitor cooldown user
const xpPerMessage = parseInt(process.env.LEVELING_XP, 10) || 15; // XP yang didapatkan per pesan

module.exports = async (message) => {
  if (message.author.bot) return; // Abaikan pesan bot

  const guildId = message.guild.id;
  const autoModSettings = await AutoMod.findOne({ where: { guildId } });

  if (!autoModSettings) return; // Jika tidak ada pengaturan, keluar

  // Leveling
  if (autoModSettings.leveling && !cooldown.has(message.author.id)) {
    await addXp(message.author.id, xpPerMessage, message); // Menambahkan XP
    cooldown.add(message.author.id); // Tambah user ke cooldown

    // Menghapus user dari cooldown setelah 1 menit
    setTimeout(() => {
      cooldown.delete(message.author.id);
    }, process.env.LEVELING_COOLDOWN || 60000);
  }

  // Cek anti-invite
  if (autoModSettings.antiInvites && /discord\.gg|discord\.com\/invite/.test(message.content)) {
    await sendWarning(message, "Anti-invite protection"); // Kirim peringatan
    return message.delete(); // Hapus pesan yang mengandung invite
  }

  // Cek anti-links
  if (autoModSettings.antiLinks && /https?:\/\/[^\s]+/.test(message.content)) {
    await sendWarning(message, "Anti-link protection"); // Kirim peringatan
    return message.delete(); // Hapus pesan yang mengandung link
  }

  // Cek anti-spam
  if (autoModSettings.antiSpam) {
    const userMessages = message.channel.messages.cache.filter((m) => m.author.id === message.author.id);

    if (userMessages.size > 5) {
      await sendWarning(message, "Anti-spam protection"); // Kirim peringatan
      return message.delete(); // Hapus pesan jika spam
    }
  }

  // Cek whitelist
  if (autoModSettings.whitelist.includes(message.author.id)) return; // Jika user ada di whitelist, keluar
  if (message.mentions.roles.size > 0) {
    for (const role of message.mentions.roles.values()) {
      if (autoModSettings.whitelist.includes(role.id)) return; // Jika role ada di whitelist, keluar
    }
  }
};

// Fungsi untuk mengirim pesan peringatan
const sendWarning = async (message, reason) => {
  const warningMessage = `🚫 **Warning!** Your message was deleted due to: **${reason}**.`;
  const warning = await message.channel.send(warningMessage);
  setTimeout(() => warning.delete(), 10000); // Hapus pesan peringatan setelah 10 detik
};