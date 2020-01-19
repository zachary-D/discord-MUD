import * as Discord from "discord.js";
import { stringify } from "querystring";

const chDestName = "announcements";

module.exports = {
    name: 'relay',
    // description: '',
    // aliases: [],
    //Comment out permissions/channel/server requirements if you want it to run everywhere/by everyone/etc
    // permissions: [],
    // inChannelID: [],
    // inChannelName: [],
    // inServerID: [],
    // inServerName: [],
    //Configures the rate limit.  The rate limit period is in second (set to 0 to disable).
    //RateLimitUser is the rate limit for individuals per period.  ..Global is the same except it is shared for all users.  The global rate limit can be disabled with -1
    rateLimitPeriod: 0,
    rateLimitUser: 1,
    rateLimitGlobal: -1,
    async execute(msg : Discord.Message, args : Array<string>) {
        //TODO: Add support for attachments

        if( !(msg.author.id === "227600936061763604" || msg.author.id === "323540712056422401"))
        {
            msg.reply("You are not authorized to use this command");
            return;
        }

        const comPrefix = "!relay";

        const chPrefix = "relay-";
        const inChannel = msg.channel as Discord.TextChannel;

        const targetChName = inChannel.name.substr(inChannel.name.indexOf(chPrefix) + chPrefix.length);
        const channelOut = msg.guild.channels.find( (ch) => ch.name === targetChName) as Discord.TextChannel;

        if(channelOut == undefined)
        {
            msg.reply("Unable to locate destination channel!");
            return;
        }

        const msgBody = msg.cleanContent.substr( msg.cleanContent.indexOf(comPrefix) + comPrefix.length );

        channelOut.send(msgBody);
    }
}