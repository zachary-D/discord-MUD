import * as Discord from "discord.js";

import {Game} from "./Game";
import {Room, RoomLink} from "./Room";

import * as utils from "./utils";

//The name of the channel that players occupy by default
const defaultChannelName = "limbo";

export class Player {
    //The room the player is in
    currentRoom: Room;

    //The game this player belongs to
    game: Game;

    //The guild member for this player
    guildMember: Discord.GuildMember;

    //The (internal) ID of this player
    id: number;
    
    //Rooms this player is aware of
    knownRooms = new Discord.Collection<number, Room>();

    static loadFromJSONObject(JSONObject: Object, parentGame: Game): Player {
        const player = new Player(JSONObject);
        player.game = parentGame;

        // player.currentRoom = player.game.rooms.get(player.currentRoom.id);

        return player;
    }

    //Displays the rooms a user knows to the  user
    async displayKnownRooms(msg : Discord.Message) : Promise<void> {
        const embed = new Discord.RichEmbed;
        
        embed.setTitle(`Rooms known to \`${msg.member.displayName}\``);
        embed.addField("Rooms", '`' + this.getKnownRooms().map(r => r.name).join("`\n`") + '`');

        await msg.reply(embed);
    }

    constructor(data?: Partial<Player>) {
        Object.apply(this, data);
    }

    //Returns a list of room names this player can move to from this one (the intersection of the rooms attached to the current one and the rooms the player is aware of)
    getKnownRooms() : Room[] {
        //TODO: IMPLEMENT
        return [];
        // return utils.intersection(this.game.rooms.array(), this.knownRooms.array());
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

    markRoomKnown(room : Room)
    {
        this.knownRooms.set(room.id, room);
        //TODO: add rooms to "newly noticed rooms" list
    }

    //Moves the player to a room
    async moveTo(room : Room) : Promise<void> {
        if(this.currentRoom == room) throw new Error("user is already in that room");

        if(this.knownRooms.get(room.id) == undefined) throw new Error("room unknown to player");

        await this.game.movePlayer(this, this.currentRoom, room);
        this.currentRoom = room;

        room.connectedRooms.forEach( r => {
            this.handleConnectedRoom(r)
        });

        //TODO: create 'noticed rooms' embed
    }
}