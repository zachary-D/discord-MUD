import * as Discord from "discord.js";

import * as commandHandler from "../Discord-Bot-Core/src/commandHandler";
import {Game} from "./Game";
import {Player} from "./Player";
import {database} from "../modules/roomManager";

export class RoomLinkOptions {
    biDirectional : boolean = true;
    direction : string;
    needsSearch : boolean  = false;
    visibility : number = 1;
}

export class RoomLinkDatabaseInternal {
    direction : string;
    from : number;
    to : number;
    visibility : number;
    needsSearch : boolean;
}

export class RoomLink {
    database : RoomLinkDatabaseInternal;

    from : Room;
    to : Room;

    get direction() : string {
        return this.database.direction;
    }

    set direction(val : string) {
        this.database.direction = val;
    }

    get visibility() : number {
        return this.database.visibility;
    }

    set visibility(val : number) {
        this.database.visibility = val;
    }

    get needsSearch() : boolean {
        return this.database.needsSearch;
    }

    set needsSearch(val : boolean) {
        this.database.needsSearch = val;
    }

    constructor(from : Room, to : Room, options : RoomLinkOptions = new RoomLinkOptions())
    {
        this.from = from;
        this.database.from = from.id;
        this.to = to;
        this.database.to = to.id;

        this.direction = options.direction;
        this.visibility = options.visibility;
        this.needsSearch = options.needsSearch;
    }
}

export class RoomDatabaseInternal {
    //If the room is anonymous (aka non-named).  If so, players must use !move <direction> to navigate through
    anonymous : boolean;
    //The room ID in the DB
    id : number;
    //The game ID
    game : number;
    //If the room is locked
    locked : boolean;
    //The room name
    name : string;
    //If the room is static.  If true, the channel is never re-used.  If false, when the room is empty the channel it's in may be re-used for another room
    static : boolean;
}

export class RoomInternal {
    database : RoomDatabaseInternal = new RoomDatabaseInternal();

    //The channel this room is attached to
    channel : Discord.TextChannel;

    //The rooms connected to this one
    connectedRooms : RoomLink[] = [];

    //The game this room belongs to
    game : Game;

    get anonymous() : boolean {
        return this.database.anonymous;
    }

    set anonymous(val : boolean) {
        this.database.anonymous = val;
    }

    get id() : number {
        return this.database.id;
    }

    set id(val : number) {
        this.database.id = val;
    }

    get locked() : boolean {
        return this.database.locked;
    }

    set locked(val : boolean) {
        this.database.locked = val;
    }

    get name() : string {
        return this.database.name;
    }

    set name(val : string) {
        this.database.name = val;
    }

    get static() : boolean {
        return this.database.static;
    }

    set static(val : boolean) {
        this.database.static = val;
    }
}

//A room players can enter
export class Room {
    protected internal : RoomInternal = new RoomInternal();
    
    get channel() : Discord.TextChannel {
        return this.internal.channel;
    }

    get connectedRooms() : RoomLink[] {
        return this.internal.connectedRooms;
    }

    get game() : Game {
        return this.internal.game;
    }

    get id() : number {
        return this.internal.id;
    }

    get locked() : boolean {
        return this.internal.locked;
    }

    get name() : string {
        return this.internal.name;
    }

    constructor(category : string | Discord.TextChannel, game : Game)
    {
        if(category instanceof Discord.TextChannel)
        {
            this.internal.channel = category;
        }
        else    //Assume it's a string
        {
            this.internal.channel = game.guild.channels.get(category) as Discord.TextChannel;
        }

        console.log(`New room instance in ${this.channel.name}`);
        this.internal.name = this.channel.name;

        if(this.channel.type != "text") throw new Error("The channel is not a text channel");

        this.internal.game = game;

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