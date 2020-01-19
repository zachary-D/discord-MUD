import * as Discord from "discord.js";

import * as relayManager from "../../../modules/relayManager";

module.exports = {
    name: 'relay',
    // description: '',
    // aliases: [],
    //Comment out permissions/channel/server requirements if you want it to run everywhere/by everyone/etc
    permissions: ["lore"],
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

        const comPrefix = "!relay";
        const msgBody = msg.cleanContent.substr( msg.cleanContent.indexOf(comPrefix) + comPrefix.length );
        const inChannel = msg.channel as Discord.TextChannel;

        relayManager.relay(msgBody, inChannel);
    }
}