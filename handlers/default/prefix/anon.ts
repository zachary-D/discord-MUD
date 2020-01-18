import * as Discord from "discord.js";

const chDestName = "announcements";

const colorMap : Map<string, string> = new Map<string, string>([
    ["detectives", "#0000FF"],
    ["mafia", "#FF0303"]
]);

module.exports = {
    name: 'anon',
    // description: '',
    // aliases: [],
    //Comment out permissions/channel/server requirements if you want it to run everywhere/by everyone/etc
    // permissions: [],
    // inChannelID: [],
    inChannelName: [ "mafia", "detectives"],
    // inServerID: [],
    // inServerName: [],
    //Configures the rate limit.  The rate limit period is in second (set to 0 to disable).
    //RateLimitUser is the rate limit for individuals per period.  ..Global is the same except it is shared for all users.  The global rate limit can be disabled with -1
    rateLimitPeriod: 0,
    rateLimitUser: 1,
    rateLimitGlobal: -1,
    async execute(msg : Discord.Message, args : Array<string>) {
        const channelOut = msg.guild.channels.find( (ch) => ch.name === chDestName) as Discord.TextChannel;

        let msgBody : string;

        {
            const cName = "anon";
            const c = msg.cleanContent;
            msgBody = c.substr(c.indexOf(cName) + cName.length);
        }

        const reply = new Discord.RichEmbed();
        const chName = (msg.channel as Discord.TextChannel).name;

        reply.setAuthor("The " + chName + " have sent a message.");
        reply.addField('\u200B', msgBody);
        
        {
            let color = colorMap.get(chName);
            if(color != undefined) reply.setColor(color);
        }

        channelOut.send(reply);
    }
}