import * as Discord from "discord.js";

//Listens for and manges reactions on a message, triggering callbacks corresponding to specific reactions
export class MessageReactionUI {

    //The callbacks to call for each emoji (ordered)
    protected callbacks : Function[];

    //The emoji to listen for (ordered)
    protected emoji : string[];

    //The message to listen for reactions on
    protected message : Discord.Message;

    //The promise for the reaction startup being complete
    readonly startupComplete : Promise<void>;

    constructor(message : Discord.Message, emoji : string[], callbacks : Function[] ) {
        this.callbacks = callbacks;
        this.emoji = emoji;
        this.message = message;

        this.startupComplete = this.doStartup();
    }

    protected async doStartup() : Promise<void> {
        
    }
}