const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// متغير لحفظ التحذيرات
const warnings = {};

client.once('ready', () => {
    console.log(`تم تسجيل الدخول بنجاح! البوت شغال باسم: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // أمر التحذير: !warn @الشخص السبب
    if (message.content.startsWith('!warn')) {
        const args = message.content.split(' ');
        const target = message.mentions.members.first();
        const reason = args.slice(2).join(' ') || 'بدون سبب';

        if (!target) {
            return message.reply('❌ يرجى منشن الشخص المراد تحذيره! مثال: `!warn @user السبب`');
        }

        // حفظ التحذير
        if (!warnings[target.id]) {
            warnings[target.id] = 0;
        }
        warnings[target.id]++;

        message.channel.send(`⚠️ تم تحذير العضو **${target.user.tag}**\n📌 السبب: ${reason}\n📊 عدد التحذيرات الحالية: **${warnings[target.id]}**`);
    }
});

// استبدل هنا التوكن حق بوتك من موقع ديسكورد ديفلوبر داخل علامات التنصيص
client.login(process.env.DISCORD_TOKEN);
