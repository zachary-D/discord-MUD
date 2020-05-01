import * as Discord from "discord.js";

import * as commandHandler from "../Discord-Bot-Core/src/commandHandler";
import {Game} from "./Game";
import {Player} from "./Player";
import { dir } from "console";

export enum CardinalDirection {
    north = "North",
    east = "East",
    south = "South",
    west = "West",
}

//Maps built-in direction descriptions to their inverses
const directionDescriptionInverses = new Discord.Collection<string, string>();

//Adds a pair of directional inverses (maps A to B and B to A)
function addDirectionDescriptionInverse(direction: string, inverse: string) {
    directionDescriptionInverses.set(direction, inverse);
    directionDescriptionInverses.set(inverse, direction);
}

//Define some default inverses
addDirectionDescriptionInverse(CardinalDirection.north, CardinalDirection.south);
addDirectionDescriptionInverse(CardinalDirection.east, CardinalDirection.west);


interface RoomLinkVisibilityOptions {
    needsSearch?: boolean;
    visibility?: number;
}

export class RoomLink implements RoomLinkVisibilityOptions {
    from: Room;
    to: Room;

    biDirectional: boolean;
    directionDescription: string;
    needsSearch: boolean;
    visibility: number;

    //TODO: figure out how rooms will be arrange (grid, hexes, octagons, custom named directions, etc.)

    static createNewLink(from : Room, to : Room, directionDescription: string, biDirectional: boolean, options: RoomLinkVisibilityOptions = {})
    {
        const link = new RoomLink();

        link.from = from;
        link.to = to;

        link.directionDescription = directionDescription;
        if(directionDescriptionInverses.get(link.directionDescription) == null && biDirectional) {
             throw new Error(`Unable to create new link: the inverse of directionDescription "${link.directionDescription}" is not known but biDirectional is set to true`);
        }

        link.biDirectional = biDirectional;

        link.needsSearch = options.needsSearch || false;

        link.visibility = options.visibility || 1;
        if(link.visibility <= 0) {
            console.log(`WARN: Room link visibility is zero.  This link will never be found.`);
            link.visibility = 0;
        }
        if(link.visibility > 1) link.visibility = 1;

        return link;
    }
}

export class Room {
    //If the room is anonymous (aka non-named).  If so, players must use !move <direction> to navigate through
    anonymous : boolean;
    //The room ID in the DB
    id : number;
    //If the room is locked
    locked : boolean;
    //The room name
    name : string;
    //If the room is static.  If true, the channel is never re-used.  If false, when the room is empty the channel it's in may be re-used for another room
    static : boolean;

    //The channel this room is attached to
    channel : Discord.TextChannel;

    //The rooms connected to this one
    connectedRooms : RoomLink[] = [];

    //The game this room belongs to
    game : Game;

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
            await msg.delete(20*1000); //Delete after a short while
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

    //Loads the room `id` into this instance
    async load(id : number) : Promise<void> {
        await this.internal.load(id);

        console.log(`New room instance ${this.name}`);

        //TODO: Clean up channel (delete and messages that weren't purged)

        //TODO: If static, find our channel
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
            embed.addField("Occupants", '`' + players.join("`\n`") + '`');
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

    linkRoom(room : Room, options : RoomLinkOptions = new RoomLinkOptions())
    {
        if(options.biDirectional && options.direction != null) throw new Error("You cannot specify a link as bidirectional and assign it a direction");

        let link = new RoomLink(this, room, options);

        this.connectedRooms.push(link);
        if(options.biDirectional)
        {
            options.biDirectional = false;
            room.linkRoom(this, options);
        }
    }
}