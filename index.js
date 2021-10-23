// Créé par Cut0x -> https://cutox.tech/

const { Discord, Client, Intents, Permissions, MessageEmbed } = require("discord.js");
const client = new Client({
    intents: [
        "GUILDS",
        "GUILD_MESSAGES",
        "DIRECT_MESSAGES",
        "GUILD_MESSAGE_REACTIONS"
    ],
    partials: [
        "CHANNEL"
    ]
});


const db = require("quick.db");
client.sett = require("./Data/config");

client.once("ready", async () => {
    console.log(`Je suis prêt pour un total de ${db.get(`ticket_count`) ?? 0} ticket ouvert.`)

    client.user.setPresence({
        activities: [
            {
                name: 'Template bot slash'
            }
        ],
        status: 'dnd'
    });
});

client.login(client.sett.token);

client.on("messageCreate", async message => {
    if (message.author.bot) return;
    
    const parentID = "ID_CATEGORIE";
    const guildID = "ID_SERVEUR";
    const supportID = "ID_ROLE_TICKET";
    const color = "#ff7f27"; // Pour la couleur, je vous conseil d'aller sur https://color.cutox.tech/ !
    const sendMessageReact = "<:NAME_EMOJI:ID_EMOJI>"; // Vous pouvez aussi mettre un émoji par défaut comme ✅

    if (message.channel.type === "DM") {
        if (db.get(`ticket_${message.author.id}`) === null) {
            client.guilds.cache.get(guildID).channels.create(`ticket-${message.author.id}`, {
                type: "GUILD_TEXT",
                parent: parentID,
                permissionOverwrites: [
                    {
                        id: supportID,
                        allow: [ Permissions.FLAGS.VIEW_CHANNEL ]
                    },
                    {
                        id: guildID,
                        deny: [ Permissions.FLAGS.VIEW_CHANNEL ]
                    }
                ]
            }).then(async channel => {
                db.set(`ticket_${message.author.id}`, true)
                db.add(`ticket_open`, 1)
                
                const embed = new MessageEmbed()
                    .setColor(color)
                    .setTitle("Nouveau ticket !")
                    .setThumbnail("https://cdn.discordapp.com/attachments/868118913639133184/901195669493153812/337796_63b6038cf2068f8e6bfccef15c13ebad.png")
                    .setAuthor(`${message.author.username} (${message.author.id})`, message.author.avatarURL({ dynamic: true, format: "webp" }))
                    .setFooter("Cliquez sur ❌ pour fermet le ticket.")
                    .addField(":bust_in_silhouette: Auteur :", `Ticket ouvert par **${message.author.username}**.`)
                    .addField("💬 Message :", `\` -> \` ${message.content}`)
                const msg = await channel.send({ embeds: [ embed ] });

                db.set(`ticket_${message.author.id}_channel`, channel.id)
                db.set(`ticket_${channel.id}`, message.author.id)
                db.set(`ticket_${channel.id}_message`, msg.id)

                msg.react("❌");

                client.on('messageReactionAdd', async (reaction, user) => {
    
                    if (user.bot || reaction.message.id !== db.get(`ticket_${channel.id}_message`)) return;

                    if (reaction.emoji.name === "❌") {
                        reaction.remove("❌")
                        db.delete(`ticket_${message.author.id}`)
                        db.subtract(`ticket_open`, 1)

                        const reponse2 = new MessageEmbed()
                            .setColor(color)
                            .setDescription(":gear: Votre ticket a été fermé par **" + user.username + "**.\n:warning: Merci de ne pas répondre à ce message !")
                        const userTicket = client.users.cache.get(db.get(`ticket_${reaction.message.channel.id}`)).send({ embeds: [ reponse2 ] })

                        const reponse = new MessageEmbed()
                            .setColor(color)
                            .setDescription(":gear: Vous avez fermé ce ticket.")
                        reaction.message.channel.send({ embeds: [ reponse ] })
                    }
                });
            })
        } else {

            if (message.content.length > 4096) return message.reply(":x: Votre message est trop lourd ! *(Moins de `4096` caractères !)*")

            const messageContent = message.content;

            const mes = new MessageEmbed()
                .setColor(color)
                .setAuthor("Nouveau message !", message.author.avatarURL({ dynamic: true }))
                .setDescription(`${messageContent}`)
                .setFooter(message.author.tag, message.author.avatarURL({ dynamic: true }))
            client.guilds.cache.get(guildID).channels.cache.get(db.get(`ticket_${message.author.id}_channel`)).send({ embeds: [ mes ] })
        }
    } else {

        if (db.get(`ticket_${message.channel.id}`) === null) return;

        const userTicket = client.users.cache.get(db.get(`ticket_${message.channel.id}`));

        if (message.content.length > 4096) return message.reply(":x: Votre message est trop lourd ! *(Moins de `4096` caractères !)*")

        const mes = new MessageEmbed()
            .setColor(color)
            .setAuthor("Nouveau message !", message.author.avatarURL({ dynamic: true }))
            .setDescription(`${message.content}`)
            .setFooter(message.author.tag, message.author.avatarURL({ dynamic: true }))
        userTicket.send({ embeds: [ mes ] })
    }
});
