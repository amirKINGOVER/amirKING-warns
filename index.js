const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});

// استدعاء التوكن من ريلواي (تأكدنا أنه WARN_TOKEN أو DISCORD_TOKEN حسب ما سميته)
const TOKEN = process.env.WARN_TOKEN || process.env.DISCORD_TOKEN;

client.once('ready', () => {
    console.log(`✅ تم تسجيل الدخول الفعال! بوت شغال باسم: ${client.user.tag}`);
    client.user.setActivity('§help | Warns System', { type: 3 });
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // مثال لأمر بسيط للاختبار
    if (message.content === '!ping' || message.content === '§ping') {
        message.reply('pong! 🏓 بوت التحذيرات شغال 100%');
    }
});

client.login(TOKEN);
