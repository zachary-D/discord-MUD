import * as Discord from "discord.js";

import * as rooms from "../../../modules/roomManager";

module.exports = {
    name: 'move',
    description: '',
    aliases: [],
    //Comment out permissions/channel/server requirements if you want it to run everywhere/by everyone/etc
    // permissions: [],
    // inChannelID: [],
    // inChannelName: [],
    // inServerID: [],
    // inServerName: [],
    //Configures the rate limit.  The rate limit period is in second (set to 0 to disable).
    //RateLimitUser is the rate limit for individuals per period.  ..Global is the same except it is shared for all users.  The global rate limit can be disabled with -1
    // rateLimitPeriod: 5,
    // rateLimitUser: 1,
    // rateLimitGlobal: -1,
    async execute(msg : Discord.Message, args : Array<string>) {
        try
        {
            await rooms.game.getPlayer(msg.author).moveTo(args[0]);
            // await rooms.moveToRoom(msg.member, msg.channel as Discord.TextChannel, args[0]);
        }
        catch(err)
        {
            if(err instanceof Error)
            {
                if(err.message === "destination is locked")
                {
                    await msg.reply("That room is locked, you cannot enter it ");
                    return;
                }
                else if(err.message === "Player not found")
                {
                    await msg.reply("Error: could not find user profile");
                    return;
                }
            }

            await msg.reply("Failed to move!");
        }
    }
}