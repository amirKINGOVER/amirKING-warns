const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
    ]
});

// قاعدة بيانات مؤقتة في الذاكرة لتخزين التحذيرات (يمكن ربطها بقاعدة بيانات لاحقاً)
// شكل التخزين: warningsData[userId] = [ {reason: "...", moderator: "..."}, ... ]
const warningsData = {};

const TOKEN = process.env.WARN_TOKEN || process.env.DISCORD_TOKEN;

// تعريف أوامر السلاش (Slash Commands)
const commands = [
    new SlashCommandBuilder()
        .setName('warn')
        .setDescription('إعطاء تحذير لعضو معين')
        .addUserOption(option => 
            option.setName('user').setDescription('العضو المراد تحذيره').setRequired(true))
        .addStringOption(option => 
            option.setName('reason').setDescription('سبب التحذير').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('عرض تحذيرات عضو معين')
        .addUserOption(option => 
            option.setName('user').setDescription('العضو المراد استعراض تحذيراته').setRequired(true)),

    new SlashCommandBuilder()
        .setName('clear-warns')
        .setDescription('مسح جميع تحذيرات عضو معين')
        .addUserOption(option => 
            option.setName('user').setDescription('العضو المراد مسح تحذيراته').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
].map(command => command.toJSON());

client.once('ready', async () => {
    console.log(`✅ تم تسجيل الدخول بنجاح كـ ${client.user.tag}`);
    client.user.setActivity('نظام التحذيرات | /warn', { type: 3 });

    // تسجيل الأوامر تلقائياً في السيرفرات
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        console.log('🔄 جاري تسجيل أوامر السلاش (Slash Commands)...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('✨ تم تسجيل الأوامر بنجاح!');
    } catch (error) {
        console.error('❌ خطأ أثناء تسجيل الأوامر:', error);
    }
});

// التعامل مع تفاعل الأوامر
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    // 1. أمر /warn
    if (commandName === 'warn') {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const moderator = interaction.user;

        if (targetUser.bot) {
            return interaction.reply({ content: '❌ لا يمكنك تحذير بوت!', ephemeral: true });
        }

        if (!warningsData[targetUser.id]) {
            warningsData[targetUser.id] = [];
        }

        warningsData[targetUser.id].push({
            reason: reason,
            moderator: moderator.tag,
            date: new Date().toLocaleDateString('ar-EG')
        });

        const warnCount = warningsData[targetUser.id].length;

        const embed = new EmbedBuilder()
            .setTitle('⚠️ تم تحذير العضو بنجاح')
            .setColor(0xF1C40F)
            .addFields(
                { name: '👤 العضو المخالف', value: `${targetUser} (${targetUser.tag})`, inline: true },
                { name: '🛡️ المشرف المسؤول', value: `${moderator}`, inline: true },
                { name: '📌 السبب', value: `\`${reason}\``, inline: false },
                { name: '📊 إجمالي التحذيرات', value: `**${warnCount}** تحذيرات`, inline: false }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        // محاولة إرسال رسالة خاصة للعضو المخالف
        try {
            await targetUser.send(`⚠️ **لقد تلقيت تحذيراً في سيرفر (${interaction.guild.name})**\n📌 السبب: \`${reason}\`\n🛡️ بواسطة المشرف: ${moderator.tag}\n📊 إجمالي تحذيراتك: **${warnCount}**`);
        } catch (e) {
            // الخاص مغلق
        }
    }

    // 2. أمر /warnings
    else if (commandName === 'warnings') {
        const targetUser = interaction.options.getUser('user');
        const userWarns = warningsData[targetUser.id] || [];

        if (userWarns.length === 0) {
            return interaction.reply({ content: `🎉 العضو ${targetUser.tag} نظيف وليس لديه أي تحذيرات!`, ephemeral: true });
        }

        let desc = userWarns.map((w, index) => `**${index + 1}.** السبب: \`${w.reason}\`\n   • بواسطة: ${w.moderator} | التاريخ: ${w.date}`).join('\n\n');

        const embed = new EmbedBuilder()
            .setTitle(`📋 سجل تحذيرات العضو: ${targetUser.tag}`)
            .setDescription(desc)
            .setColor(0xE67E22)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // 3. أمر /clear-warns
    else if (commandName === 'clear-warns') {
        const targetUser = interaction.options.getUser('user');
        
        if (!warningsData[targetUser.id] || warningsData[targetUser.id].length === 0) {
            return interaction.reply({ content: `ℹ️ العضو ${targetUser.tag} ليس لديه أي تحذيرات أصلًا لمسحها.`, ephemeral: true });
        }

        warningsData[targetUser.id] = [];

        const embed = new EmbedBuilder()
            .setTitle('🧹 تم مسح التحذيرات')
            .setDescription(`✅ تم بنجاح تصفير ومسح جميع تحذيرات العضو **${targetUser.tag}**.`)
            .setColor(0x2ECC71)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
});

client.login(TOKEN);
