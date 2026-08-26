const { Client, GatewayIntentBits, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.once('ready', () => {
    console.log(`✅ تم تسجيل الدخول بنجاح باسم: ${client.user.tag}`);
    client.user.setActivity('§help لأوامر البوت', { type: 3 });
});

// ترحيب الأعضاء الجدد
client.on('guildMemberAdd', member => {
    const channel = member.guild.systemChannel;
    if (!channel) return;
    channel.send(`🎉 أهلاً بك يا ${member} في السيرفر! نورتنا يا ملك! 👑`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const prefix = '§';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // 1. أمر المساعدة (Help)
    if (command === 'help') {
        return message.reply(`
📜 **قائمة أوامر بوت amirKING-warns:**
• \`§warn @User [السبب]\` - لتحذير عضو مخالف.
• \`§kick @User [السبب]\` - لطرد عضو من السيرفر.
• \`§ban @User [السبب]\` - لحظر عضو من السيرفر.
• \`§clear [عدد]\` - لمسح الرسائل (من 1 إلى 99).
• \`§ticket\` - لإرسال لوحة فتح التذاكر (للإدارة).
        `);
    }

    // 2. أمر إرسال لوحة التذاكر (Ticket Setup)
    if (command === 'ticket') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ هذا الأمر خاص بالمسؤولين فقط (Administrator)!');
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('create_ticket')
                .setLabel('🎫 فتح تذكرة جديدة')
                .setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({
            content: '🎟️ **نظام التذاكر والدعم الفني:**\nاضغط على الزر أدناه لفتح تذكرة جديدة للتواصل مع الإدارة.',
            components: [row]
        });
        
        return message.delete().catch(() => {}); // حذف رسالة الأمر لتكون القناة مرتبة
    }

    // 3. أوامر الإدارة (Warn, Kick, Ban, Clear) نفس الكود السابق
    if (command === 'warn') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.reply('❌ ما عندك صلاحية لتحذير الأعضاء!');
        }
        const target = message.mentions.members.first();
        const reason = args.slice(1).join(' ') || 'بدون سبب';
        if (!target) return message.reply('⚠️ يرجى منشن الشخص المراد تحذيره!');
        return message.reply(`✅ تم تحذير العضو ${target.user.tag} بنجاح!\n📝 **السبب:** ${reason}`);
    }

    if (command === 'clear') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return message.reply('❌ ليس لديك صلاحية!');
        const count = parseInt(args[0]);
        if (isNaN(count) || count < 1 || count > 99) return message.reply('⚠️ حدد رقماً بين 1 و 99');
        await message.channel.bulkDelete(count + 1, true);
        const msg = await message.channel.send(`🧹 تم مسح **${count}** رسالة.`);
        setTimeout(() => msg.delete().catch(() => {}), 4000);
    }
});

// التفاعل مع الأزرار (فتح وإغلاق التذاكر)
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    // عند الضغط على زر فتح تذكرة
    if (interaction.customId === 'create_ticket') {
        const guild = interaction.guild;
        const member = interaction.member;

        // منع فتح أكثر من تذكرة لنفس المستخدم (اختياري) أو إنشاء قناة جديدة مباشرة
        const channelName = `ticket-${member.user.username}`;
        
        try {
            const ticketChannel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: guild.id, // منع الجميع من رؤية القناة
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        id: member.id, // السماح لصاحب التذكرة برؤيتها والكتابة فيها
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                    },
                    {
                        id: client.user.id, // السماح للبوت
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels],
                    }
                ],
            });

            const closeRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('🔒 إغلاق التذكرة')
                    .setStyle(ButtonStyle.Danger)
            );

            await ticketChannel.send({
                content: `مرحباً ${member} 👋\nطرحت إدارتنا هنا لمساعدتك. يرجى كتابة مشكلتك أو استفسارك بالتفصيل وسيقوم أحد المسؤولين بالرد عليك قريباً.`,
                components: [closeRow]
            });

            return interaction.reply({ content: `✅ تم إنشاء تذكرتك بنجاح: ${ticketChannel}`, ephemeral: true });
        } catch (error) {
            return interaction.reply({ content: '❌ حدث خطأ أثناء إنشاء التذكرة.', ephemeral: true });
        }
    }

    // عند الضغط على زر إغلاق التذكرة
    if (interaction.customId === 'close_ticket') {
        const channel = interaction.channel;
        await interaction.reply({ content: '🔒 جاري إغلاق وحذف التذكرة خلال 5 ثوانٍ...' });
        setTimeout(() => {
            channel.delete().catch(() => {});
        }, 5000);
    }
});

client.login(process.env.DISCORD_TOKEN);
