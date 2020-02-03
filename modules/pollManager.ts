import * as Discord from "discord.js";

enum pollResponse {
    for,
    against,
    neutral
}

export class Poll {
    //The user that created the poll
    protected author : Discord.GuildMember;

    //The channel the poll was created in
    protected channel : Discord.TextChannel;

    //The message created for the poll
    protected pollMessage : Discord.Message;

    //The emoji used for the poll (thumbs-up, '?', thumbs-down)
    static reactEmojiIdentifiers : string[] = ['👍', '❓', '👎'];

    //A promise for the poll's initial setup to be complete
    protected setupComplete : Promise<void>;

    //The poll's topic (what's being voted on)
    protected topic : string;

    //The responses to this poll
    protected userVotes : Discord.Collection<Discord.Snowflake, pollResponse> = new Discord.Collection<Discord.Snowflake, pollResponse>();

    //The total votes for/neutral/against
    protected votesAgainst : number;
    protected votesFor : number;
    protected votesNeutral : number;

    constructor(topic : string, channel : Discord.TextChannel, creator : Discord.GuildMember)
    {
        this.author = creator;
        this.channel = channel;
        this.topic = topic;

        this.setupComplete = this.doSetup();
    }

    buildEmbed() : Discord.RichEmbed
    {
        const embed = new Discord.RichEmbed();
        
        embed.setAuthor(this.author.displayName, this.author.user.avatarURL);

        embed.addField("Topic", this.topic);

        return embed;
    }

    protected async doSetup() : Promise<void>
    {
        this.pollMessage = await this.channel.send(this.buildEmbed()) as Discord.Message;
        
        for(let i = 0; i < Poll.reactEmojiIdentifiers.length; i++)
        {
            await this.pollMessage.react(Poll.reactEmojiIdentifiers[i]);
        }
    }
}