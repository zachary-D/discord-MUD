import * as Discord from "discord.js";

import {Game} from "./Game";
import {Room, RoomLink} from "./Room";
import {database} from "../modules/roomManager";

import * as utils from "./utils";

//The name of the channel that players occupy by default
const defaultChannelName = "limbo";

export class PlayerDatabaseInternal {
    id : number;
    game : number;
    discordUserID : string;
    
    async load(id : number) : Promise<void> {

    }

    async save() : Promise<void> {
        throw new Error("Not yet implemented");
    }
}

export class PlayerInternal {
    database : PlayerDatabaseInternal = new PlayerDatabaseInternal();

    //The room the player is in
    currentRoom : Room;

    //The game this player is a part of
    game : Game;

    //The guild member object for the player
    guildMember : Discord.GuildMember;

    //Rooms this player is aware of
    knownRooms = new Discord.Collection<number, Room>();

    async load(id : number) : Promise<void> {
        await this.database.load(id);

        // this.currentRoom = this.game.getRoomByID(this.database)

        //game is already populated from the parent, just check it
        if(this.database.game != this.game.id) {
            throw new Error("Database game ID is different from the parent game's ID");
        }
    }

    async save() : Promise<void> {
        throw new Error("Not yet implemented");
    }
}

//A player in a game
export class Player {
    internal : PlayerInternal = new PlayerInternal();


    get currentRoom() : Room {
        return this.internal.currentRoom;
    }

    get game() : Game {
        return this.internal.game;
    }

    get knownRooms() : Discord.Collection<number, Room> {
        return this.internal.knownRooms;
    }

    
    get member() : Discord.GuildMember { 
        return this.internal.guildMember;
    }

    constructor(parent : Game)
    {
        this.internal.game = parent;
    }

    //Displays the rooms a user knows to the  user
    async displayKnownRooms(msg : Discord.Message) : Promise<void> {
        const embed = new Discord.RichEmbed;
        
        embed.setTitle(`Rooms known to \`${msg.member.displayName}\``);
        embed.addField("Rooms", '`' + this.getKnownRooms().map(r => r.name).join("`\n`") + '`');

        await msg.reply(embed);
    }

    //Returns a list of room names this player can move to from this one (the intersection of the rooms attached to the current one and the rooms the player is aware of)
    getKnownRooms() : Room[] {
 
        return utils.intersection(this.game.rooms.array(), this.knownRooms.array());
    }

    //Handles a room connection, running any random checks and marking discovered rules as known
    handleConnectedRoom(link : RoomLink)
    {
        if(link.needsSearch) return;

        //Determine if the player noticed the room or not (based on the room's visibility)
        if(Math.random() <= link.visibility)
        {
            this.markRoomKnown(link.to);
        }
    }

    //Loads the game `id` into this instance
    async load(id : number) : Promise<void> {
        await this.internal.load(id);

        console.log(`New player instance for ${this.member.displayName} aka ${this.member.user.tag}`);


        //Ensure the player has the game-role
    }

    markRoomKnown(room : Room)
    {
        this.knownRooms.set(room.id, room);
        //TODO: add rooms to "newly noticed rooms" list
    }

    //Moves the player to a room
    async moveTo(room : Room | string) : Promise<void> {
        if(room instanceof Room)
        {
            //Do nothing, just here to appease the typescript multi-type checker thing
        }
        else //Assume string, get the room object matching that name or ID
        {
            let n = this.game.getRoomByName(room);
            if(n == undefined) n = this.game.getRoomByChannel(room);
            if(n == undefined) throw new Error(`room unknown to player`) 
            room = n;
        }

        if(this.currentRoom == room) throw new Error("user is already in that room");

        if(this.knownRooms.get(room.id) == undefined) throw new Error("room unknown to player");

        await this.game.movePlayer(this, this.currentRoom, room);
        this.internal.currentRoom = room;

        room.connectedRooms.forEach( r => {
            this.handleConnectedRoom(r)
        });

        //TODO: create 'noticed rooms' embed
    }
}