import * as Discord from "discord.js";

import * as commandHandler from "../Discord-Bot-Core/src/commandHandler";
import {Game} from "./Game";
import {Player} from "./Player";

export enum RoomType {
    named,      //A room you can use !move <name> to go to
    anonymous   //A room you must use !move <direction> to navigate through
}

export type roomID = number;

export class RoomLink {
    from : roomID;
    to : roomID;
    visibility : number;
}

//A room players can enter
export class Room {
    //The rooms connected to this one
    connectedRooms : RoomLink[] = [];

    //The game this room belongs to
    protected _game : Game;

    //The channel for this room
    protected textChannel : Discord.TextChannel;

    //If this room can be entered
    protected locked : boolean;

    get channel() : Discord.TextChannel {
        return this.textChannel;
    }

    get channelID() : string {
        return this.channel.id;
    }

    get channelName() : string {
        return this.channel.name;
    }

    get isLocked() : boolean {
        return this.locked;
    }

    get game() : Game {
        return this._game;
    }

    get name() : string {
        return this.channel.name;
    }

    constructor(category : string | Discord.TextChannel, game : Game)
    {
        if(category instanceof Discord.TextChannel)
        {
            this.textChannel = category;
        }
        else    //Assume it's a string
        {
            this.textChannel = game.guild.channels.get(category) as Discord.TextChannel;
        }

        console.log(`New room instance in ${this.channel.name}`);

        if(this.channel.type != "text") throw new Error("The channel is not a text channel");

        this._game = game;

        commandHandler.bind(this.channel, "room");
    }

    //Allows a user to view this channel
    async allowPlayer(player : Player)
    {
        if(this.locked) throw new Error("Cannot enter - room is locked");
        
        let newPerms : Discord.PermissionOverwriteOptions = {
            READ_MESSAGES : true,
            SEND_MESSAGES : true,
            READ_MESSAGE_HISTORY : false
        }

        await this.channel.overwritePermissions(player.member, newPerms);
    }

    //Prevents a user from viewing this channel
    async excludePlayer(player : Player)
    {
        let newPerms : Discord.PermissionOverwriteOptions = {
            READ_MESSAGES : false,
            SEND_MESSAGES : false,
            READ_MESSAGE_HISTORY : false
        }

        await this.channel.overwritePermissions(player.member, newPerms);
    }

    //Handles a message in this room
    async handleMessage(msg : Discord.Message) : Promise<void> {
        try 
        {
            await msg.delete(10*1000); //Delete after a few seconds
        }
        catch(err)
        {
            if(err instanceof Discord.DiscordAPIError)
            {
                if(err.message = "Unknown Message")
                {
                    //Assume it was a command or a message that was otherwise deleted previously
                    return;
                }
            }

            //re-throw it otherwise
            throw err;
        }
    }

    //Sends the "user entered the room, current occupants" message and allows a user to view the channel
    async playerEntered(player : Player)
    {
        await this.allowPlayer(player);

        const embed = new Discord.RichEmbed();
        embed.setTitle(`\`${player.member.displayName}\` has entered the room`);
        embed.setThumbnail(player.member.user.avatarURL);

        let players = this.game.getPlayersInRoom(this).map(p=>p.member.displayName).sort();
        if(players.length != 0)
        {
            embed.addField("People in the room", '`' + players.join("`\n`") + '`');
        }

        await this.channel.send(embed);
    }

    //Sends the "user left the room" message and prevents a user from viewing the channel
    async playerLeft(player : Player)
    {
        //Build and send the 'left' embed

        await this.excludePlayer(player);

        const embed = new Discord.RichEmbed();
        embed.setTitle(`\`${player.member.displayName}\` has left the room`);
        embed.setThumbnail(player.member.user.avatarURL);

        await this.channel.send(embed);
    }

    linkRoom(room : Room, biDirectional = true)
    {
        this.connectedRooms.push(room);
        if(biDirectional) room.linkRoom(this, false);
    }
}