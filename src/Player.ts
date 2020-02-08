import * as Discord from "discord.js";

import {Game} from "./Game";
import {Room, RoomLink} from "./Room";

import * as utils from "./utils";

//The name of the channel that players occupy by default
const defaultChannelName = "limbo";

//A player in a game
export class Player {
    //The room the player is in
    protected _currentRoom : Room;

    //The guild member object for the player
    protected guildMember : Discord.GuildMember;
    
    //Rooms this player is aware of
    protected knownRooms = new Discord.Collection<Discord.Snowflake, Room>();

    //The game this player is a part of
    protected parentGame : Game;

    get game() : Game {
        return this.parentGame;
    }
    
    get member() : Discord.GuildMember { 
        return this.guildMember;
    }

    get currentRoom() : Room {
        return this._currentRoom;
    }

    set currentRoom(val : Room) {
        this._currentRoom = val;
    }

    constructor(member : Discord.GuildMember, game : Game)
    {
        this.guildMember = member;
        this.parentGame = game;

        console.log(`New player instance for ${member.displayName} aka ${member.user.tag}`);

        //TODO: remove this it's a temp fix
        //TEMP:
        this._currentRoom = this.game.getRoomByName(defaultChannelName);
        this.knownRooms.set(this.currentRoom.channel.id, this.currentRoom);
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

    //Marks the room as 'known'
    learnRoom(roomLink : RoomLink)
    {
        this.knownRooms.set(room.channel.id, room);
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

        if(this._currentRoom == room) throw new Error("user is already in that room");

        if(this.knownRooms.get(room.channel.id) == undefined) throw new Error("room unknown to player");

        await this.game.movePlayer(this, this.currentRoom, room);
        this._currentRoom = room;

        room.connectedRooms.forEach( r => {
            this.learnRoom(r)
        })
    }
}