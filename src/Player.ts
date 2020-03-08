import * as Discord from "discord.js";

import {getQuery} from "./databaseManager";
import {Game} from "./Game";
import {Room, RoomLink} from "./Room";

import * as utils from "./utils";

//The name of the channel that players occupy by default
const defaultChannelName = "limbo";

export class PlayerDatabaseInternal {
    currentRoom : number;   //ADD TO DB
    id : number;
    game : number;
    discordUserID : string;
    
    //Loads the player by player ID
    async loadById(id : number) : Promise<void> {
        this.preLoadTasks();
        let data = await getQuery("loadPlayerById").query(id);
        Object.assign(this, data);
    }

    //Loads the player by member ID and game ID
    async loadByMemberAndGame(member : Discord.GuildMember, game : Game) {
        this.preLoadTasks();
        let data = await getQuery("loadPlayerByMemberAndGame").query(member.id, game.id);
        Object.assign(this, data);
    }
    
    preLoadTasks() {
        this.currentRoom = null;
        this.id = null;
        this.game = null;
        this.discordUserID = null;
    }

    async save() : Promise<void> {
        await getQuery("savePlayer").query(this.game, this.discordUserID, this.id);
    }
}

//TODO: figure out how to ensure that the changes here propagate down to the DBInternal class
export class PlayerInternal {
    private database : PlayerDatabaseInternal = new PlayerDatabaseInternal();

    //The room the player is in
    private _currentRoom : Room;

    get currentRoom() : Room {
        return this._currentRoom;
    }

    set currentRoom(value : Room) {
        this._currentRoom = value;
        this.database.currentRoom = this._currentRoom.id
    }

    get id() : number {
        return this.database.id; 
    }

    //The game this player is a part of
    private _game : Game;

    get game() : Game {
        return this._game;
    }

    set game(value : Game) {
        this._game = value;
        this.database.game = this._game.id;
    }

    //The guild member object for the player
    private _guildMember : Discord.GuildMember;

    get guildMember() : Discord.GuildMember {
        return this._guildMember;
    }

    set guildMember(value : Discord.GuildMember) {
        this._guildMember = value;
        this.database.discordUserID = this._guildMember.id;
    }

    //Rooms this player is aware of
    knownRooms = new Discord.Collection<number, Room>();

    private async initObjects() {
        //game is already populated from the parent, just check it
        if(this.database.game != this.game.id) {
            throw new Error("Database game ID is different from the parent game's ID");
        }

        if(this.guildMember == undefined) {
            //If the guildMember is undefined, load it 
            this.guildMember = this.game.guild.members.get(this.database.discordUserID);

            //TODO: should probably get a 'real' debug/warn/err logging system
            if(this.guildMember == undefined) console.log(`WARNING: player ${this.id} loaded without valid discord userID`);
        }
        else {
            //Otherwise check it
            if(this.guildMember.id != this.database.discordUserID) {
                throw new Error("error loading: loaded userID is different than the member's ID");
            }
        }
    }

    async loadById(id : number) : Promise<void> {
        await this.database.loadById(id);
        await this.initObjects();
    }

    async loadByMember(member : Discord.GuildMember) : Promise<void> {
        await this.database.loadByMemberAndGame(member, this.game);
        await this.initObjects();
    }

    async save() : Promise<void> {
        this.database.save();
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

    //Loads the player for the guild member `member` for the game this player is attached to
    async loadByMember(member : Discord.GuildMember) : Promise<void> {
        await this.internal.loadByMember(member);

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