import * as Discord from "discord.js";

import {client} from "../Discord-Bot-Core/bot";

const chPrefix = "relay-";

const relays : Array<Relay> = [];

class Relay {
    
    from : Discord.TextChannel;
    to: Discord.TextChannel;


    constructor(from : Discord.TextChannel, to: Discord.TextChannel)
    {
        this.from = from;
        this.to = to;

        client.on("message", (msg) => {
            this.handleMessage(msg);
        });
    }

    async handleMessage(msg : Discord.Message)
    {
        if(msg.channel.id != this.from.id) return;  //Filter by channel
        //if(msg.author.id == client.user.id) return; //Ignore ourselves

        Relay.relayMessage(msg, this.to);
    }
    
    static relayMessage(msg : Discord.Message, to : Discord.TextChannel)
    {
        //attachments - done
        //body - done
        //embeds
        //sync edits?

        let fileArray = [];

        msg.attachments.forEach( (f) => 
            fileArray.push(f.url)
        )

        let msgOut : Discord.MessageOptions = {
            files : fileArray,
        };

        to.send(msg.member.displayName + ": " + msg.cleanContent, msgOut);
    }
}

function createRelay(channel : Discord.TextChannel)
{
    const targetChName = channel.name.substr(channel.name.indexOf(chPrefix) + chPrefix.length);
    const channelSrc = channel.guild.channels.find( (ch) => ch.name === targetChName) as Discord.TextChannel;
    
    if(channelSrc == undefined) return;

    relays.push(new Relay(channelSrc, channel));
}

function loadRelaysInServer(server : Discord.Guild)
{
    server.channels.forEach( (ch) => {
        if(ch.name.startsWith(chPrefix)) createRelay(ch as Discord.TextChannel);
    });
}

let didLoad = false;

function loadRelays()
{
    if(didLoad) return;
    
    client.guilds.forEach( (s) => {
        loadRelaysInServer(s);
    });

    didLoad = true;
}

client.on("ready", () => {
    loadRelays();
});