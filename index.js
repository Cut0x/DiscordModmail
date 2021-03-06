// Créé par Cut0x -> https://discord.cutox.tech/

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
    client.user.setPresence({
        activities: [
            {
                name: `MP MOI - ${db.get(`ticket_count`) ?? 0} ticket ouvert.`
            }
        ],
        status: 'dnd'
    });
    
    // db.delete("ticket_TonIdDiscord")
    
    console.log(`Je suis prêt!`)
});

client.login(client.sett.token);

client.on("messageCreate", async message => {
    if (message.author.bot) return;
    const messageContent = message.content;
    
    const parentID = "ID_CATEGORIE";
    const guildID = "ID_SERVEUR";
    const supportID = "ID_ROLE_TICKET";
    const color = "#ff7f27"; // Pour la couleur, je vous conseil d'aller sur https://color.cutox.tech/ !
    const sendMessageReact = "<:NAME_EMOJI:ID_EMOJI>"; // Vous pouvez aussi mettre un émoji par défaut comme ✅
    let lettres = [
        "a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z",
        "A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"
    ];
    let id_ticket = "";
    
    for (let i = 0; i <= 6; i++) {
        id_ticket += lettres[Math.floor(Math.random() * lettres.length)]
    };
    
    if (message.channel.type === "DM") {
        if (db.get(`ticket_${message.author.id}`) === null) {
             if (message.content.length > 4000) return message.reply(":x: Votre message est trop lourd ! *(Moins de `4000` caractères !)*")
            
            client.guilds.cache.get(guildID).channels.create(`ticket-${id_ticket}`, {
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
                try {
                    db.set(`ticket_${message.author.id}`, true)
                    db.add(`ticket_count`, 1)
                    client.user.setPresence({
                        activities: [
                            {
                                name: `MP MOI - ${db.get(`ticket_count`) ?? 0} ticket ouvert.`
                            }
                        ],
                        status: 'dnd'
                    });
                    
                    const embed = new MessageEmbed()
                        .setColor(color)
                        .setTitle("Nouveau ticket !")
                        .setThumbnail("https://cdn.discordapp.com/attachments/868118913639133184/901195669493153812/337796_63b6038cf2068f8e6bfccef15c13ebad.png")
                        .setAuthor(`${message.author.username} (${message.author.id})`, message.author.avatarURL({ dynamic: true, format: "webp" }))
                        .setFooter("Cliquez sur ❌ pour fermet le ticket.")
                        .addField(":bust_in_silhouette: Ticket :", `Ticket de ${message.author} (**${message.author.username}**).\nL'ID du ticket est \`${id_ticket}\`.`)
                    if (message.content.length >= 1) {
                        const [attachment] = message.attachments.values();
                        const url = attachment ? attachment.url : null;
                        embed.addField("💬 Message :", `\` -> \` ${message.content}`)
                    }
                    if (message.attachments.size >= 1) {
                        const [attachment] = message.attachments.values();
                        const url = attachment ? attachment.url : null;
                        embed.setImage(url)
                    }
                    const msg = await channel.send({ embeds: [ embed ] });

                    msg.pin().catch(error => {});

                    db.set(`ticket_${message.author.id}_channel`, channel.id)
                    db.set(`ticket_${channel.id}`, message.author.id)
                    db.set(`ticket_${channel.id}_message`, msg.id)

                    message.react(sendMessageReact);
                    msg.react("❌");

                    client.on('messageReactionAdd', async (reaction, user) => {
    
                        if (user.bot || reaction.message.id !== db.get(`ticket_${channel.id}_message`)) return;

                        if (reaction.emoji.name === "❌") {
                            reaction.remove("❌")
                            db.delete(`ticket_${message.author.id}`)
                            db.subtract(`ticket_count`, 1)
                            client.user.setPresence({
                                activities: [
                                    {
                                        name: `MP MOI - ${db.get(`ticket_count`) ?? 0} ticket ouvert.`
                                    }
                                ],
                                status: 'dnd'
                            });
                            channel.setName(`close-${id_ticket}`)

                            const reponse2 = new MessageEmbed()
                                .setColor(color)
                                .setDescription(":gear: Votre ticket a été fermé par **" + user.username + "**.\n:warning: Merci de ne pas répondre à ce message !")
                            const userTicket = client.users.cache.get(db.get(`ticket_${reaction.message.channel.id}`)).send({ embeds: [ reponse2 ] })

                            db.delete(`ticket_${message.author.id}_channel`)
                            db.delete(`ticket_${channel.id}`)
                            db.delete(`ticket_${channel.id}_message`)

                            const reponse = new MessageEmbed()
                                .setColor(color)
                                .setDescription(":gear: Vous avez fermé ce ticket.")
                            reaction.message.channel.send({ embeds: [ reponse ] })
                        }
                    });
                } catch (error) {
                    message.react("❌");
                    console.log("[1] une erreur est survenue");
                    console.error(error);
                }
            })
        } else {

            if (message.content.length > 4096) return message.reply(":x: Votre message est trop lourd ! *(Moins de `4096` caractères !)*")

            try {                
                const mes = new MessageEmbed()
                    .setColor(color)
                    .setAuthor("Nouveau message !", client.user.avatarURL({ dynamic: true }))
                    .setFooter(message.author.tag, message.author.avatarURL({ dynamic: true }))
                if (message.content.length >= 1) {
                    const [attachment] = message.attachments.values();
                    const url = attachment ? attachment.url : null;
                    mes.setDescription(`${messageContent}`)
                }
                if (message.attachments.size >= 1) {
                    const [attachment] = message.attachments.values();
                    const url = attachment ? attachment.url : null;
                    mes.setImage(url)
                }
                client.guilds.cache.get(guildID).channels.cache.get(db.get(`ticket_${message.author.id}_channel`)).send({ embeds: [ mes ] })

                message.react(sendMessageReact);
            } catch (error) {
                message.react("❌");
                console.log("[2] une erreur est survenue");
                console.error(error);
            }
        }
    } else {

        if (db.get(`ticket_${message.channel.id}`) === null) return;
    
        try {
            const userTicket = client.users.cache.get(db.get(`ticket_${message.channel.id}`));
            
            if (message.content.length > 4096) return message.reply(":x: Votre message est trop lourd ! *(Moins de `4096` caractères !)*")
                        
            const mes = new MessageEmbed()
                .setColor(color)
                .setAuthor("Nouveau message !", client.user.avatarURL({ dynamic: true }))
                .setFooter(message.author.tag, message.author.avatarURL({ dynamic: true }))
            if (message.content.length >= 1) {
                const [attachment] = message.attachments.values();
                const url = attachment ? attachment.url : null;
                mes.setDescription(`${messageContent}`)
            }
            if (message.attachments.size >= 1) {
                const [attachment] = message.attachments.values();
                const url = attachment ? attachment.url : null;
                mes.setImage(url)
            }
            userTicket.send({ embeds: [ mes ] })

            message.react(sendMessageReact);
        } catch (error) {
            message.react("❌");
            console.log("[3] une erreur est survenue");
            console.error(error);
        }
    }
});
