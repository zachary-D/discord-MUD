import * as Discord from "discord.js";

import {client} from "../Discord-Bot-Core/bot";
import {Room} from "./Room";
import {Player} from "./Player";
import {database} from "../modules/roomManager";

//The name of the role that all game members have
const playerRoleName = "Participants";

//The name of the channel containing info (i.e. how to use the bot) that is in the category but should not be treated as a room
const infoChannelName = "the-map";

const sql_loadGame = database.prepareStatement("select id, guild, categoryChannel, status from games where id = ?");
const sql_saveGame = database.prepareStatement("update games set guild = ?, categoryChannel = ?, status = ? where id = ?");

const sql_getRoomsForGame = database.prepareStatement("select id from rooms where game = ?");
const sql_getPlayersForGame = database.prepareStatement("select id from players where game = ?");

export enum GameStatus {
    notStarted = 0,
    inProgress = 1,
    done = 2
}

//A game, as represented in-database
export class GameDatabaseInternal {
    //The game ID
    id : number;

    //The guild ID
    guild : string;

    //The category channel ID
    categoryChannel : string;

    //The status of the game
    status : GameStatus;

    //Loads the game data for `id` from the database
    async load(id : number) : Promise<void> {
        let obj = await sql_loadGame.query(id);
        Object.assign(this, obj);
    }

    async save() : Promise<void> {
        await sql_saveGame.query(this.guild, this.categoryChannel, this.status, this.id);
    }
}

//A game's internal objects
export class GameInternal {
    database : GameDatabaseInternal = new GameDatabaseInternal();

    //The category channel that contains the other rooms
    categoryChannel : Discord.CategoryChannel;

    //The guild this game takes place in
    guild : Discord.Guild;

    //The role all players of this game have
    playerRole : Discord.Role;

    //The players in this game
    players = new Discord.Collection<Discord.Snowflake, Player>();

    //The rooms contained within the map
    rooms = new Discord.Collection<string, Room>();

    get id() : number {
        return this.database.id;
    }

    set id(val : number) {
        this.database.id = val;
    }

    get status() : GameStatus {
        return this.database.status;
    }

    set status(val : GameStatus) {
        this.database.status = val;
    }

    async load(id : number) : Promise<void> {
        await this.database.load(id);

        this.guild = client.guilds.get(this.database.guild);
        if(this.guild == undefined) throw new Error("Guild not found");

        this.categoryChannel = this.guild.channels.get(this.database.categoryChannel) as Discord.CategoryChannel;
        if(this.categoryChannel == undefined) throw new Error("CategoryChannel not found");

        this.playerRole = this.guild.roles.find( (r) => r.name == playerRoleName);
        if(this.playerRole == undefined) throw new Error("Player role not found");

        let playerProm = this.loadPlayers();

        let roomProm = this.loadRooms();

        await playerProm;
        await roomProm;
    }

    async loadPlayers() : Promise<void> {
        let ids = await sql_getPlayersForGame.query(this.id);
        let promises : Promise<void>[] = [];

        for(let i = 0; i < ids.length; i++)
        {
            let p = new Player();
            this.players.set(ids[i], p);
            promises.push(p.load(ids[i]));
        }

        await Promise.all(promises);
    }

    async loadRooms() : Promise<void> {
        let ids = await sql_getRoomsForGame.query(this.id);
        let promises : Promise<void>[] = [];

        for(let i = 0; i < ids.length; i++)
        {
            let r = new Room();
            this.players.set(ids[i], r);
            promises.push(r.load(ids[i]));
        }

        await Promise.all(promises);
    }
}

//A game
export class Game {
    protected internal : GameInternal = new GameInternal();

    get categoryChannel() : Discord.CategoryChannel {
        return this.internal.categoryChannel;
    }

    get guild() : Discord.Guild {
        return this.internal.guild
    }

    get id() : number {
        return this.internal.id;
    }

    get playerRole() : Discord.Role
    {
        return this.internal.playerRole;
    }

    get players() : Discord.Collection<Discord.Snowflake, Player> {
        return this.internal.players;
    }

    get rooms() : Discord.Collection<string, Room> {
        return this.internal.rooms;
    }

    get status() : GameStatus {
        return this.internal.status;
    }

    constructor(category : string | Discord.CategoryChannel)
    {
        
    }

    //Returns true if this map contains the channel passed to it 
    doesContain(ch : string | Discord.TextChannel) : boolean {

        //Convert TextChannel objects to IDs
        if(ch instanceof Discord.TextChannel)
        {
            ch = ch.id;
        }

        for(let i = 0; i < this.internal.rooms.array().length; i++)
        {
            if(this.internal.rooms.array()[i].channel.id == ch) return true;
        }

        return false;
    }

    //Returns the room with the name matching `name`
    getRoomByName(name : string) : Room {
        
        //Format the incoming name
        {
            name = name.trim();

            while(name.startsWith("#"))
            {
                name = name.substr(1);
            }
        }

        let room : Room = this.internal.rooms.find( (r) => r.name === name );

        if(room == undefined) throw new Error("Room not found");

        return room;
    }

    //Returns the room linked to the given channel
    getRoomByChannel(ch : string | Discord.GuildChannel) : Room {
        let id : string;

        if(ch instanceof Discord.GuildChannel)
        {
            id = ch.id;
        }
        else    //Assume it's a string
        {
            id = ch; 
        }

        let room : Room = this.internal.rooms.find( (r) => r.channel.id == id);

        if(room == undefined) throw new Error("Room not found");

        return room;
    }

    //Returns the player for a given user
    getPlayer(p : Discord.Snowflake | Discord.User) : Player
    {
        if(p instanceof Discord.User)
        {
            p = p.id;
        }
        
        let player : Player = this.internal.players.get(p);

        if(player == undefined) throw new Error("Player not found");

        return player;
    }

    //Returns a list of players in a given room
    getPlayersInRoom(room : Room) : Player[] {
        return this.internal.players.filter( p => p.currentRoom == room).array();
    }

    //Handles a message
    async handleMessage(msg : Discord.Message) : Promise<void> {
        if(msg.channel instanceof Discord.DMChannel)
        {
            //handle commands via DM in the future
        }
        else if(msg.channel instanceof Discord.TextChannel)
        {
            //Ignore messages outside the guild containing this game
            if(msg.guild === this.guild)
                this.getRoomByChannel(msg.channel).handleMessage(msg);
        }
    }

    async load(id : number) : Promise<void>
    {
        await this.internal.load(id);

        console.log(`Loading a Game in ${ this.categoryChannel.name }`)

        if(this.categoryChannel.type != "category") throw new Error("The channel given is not a category channel");

        //Spawn all child-channels as Rooms
        for(let i = 0; i < this.categoryChannel.children.array().length; i++)
        {
            //Skip the info-channel
            if(this.categoryChannel.children.array()[i].name === infoChannelName) continue;

            //Skip VCs, or anything else that made its way into the mix by accident
            if(this.categoryChannel.children.array()[i].type != "text") continue;

            this.internal.rooms.set(
                this.categoryChannel.children.array()[i].id,
                new Room(this.categoryChannel.children.array()[i] as Discord.TextChannel, this)
            );
        }

        

        this.playerRole.members.forEach( m => {
            this.internal.players.set(m.id, new Player(m, this));
        })

        // gameInstances.set(this.guild.id, this);
    }

    //Moves a player from one room to another
    async movePlayer(player : Player, from : Room, to : Room)
    {
        //TODO: potentially move players to limbo first
        await to.playerEntered(player);
        await from.playerLeft(player);
    }

    async resyncPlayerRoomPermissions(player : Player) : Promise<void>
    {
        let proms : Promise<unknown>[] = [];

        this.internal.rooms.forEach( r => {
            if(r == player.currentRoom) proms.push(r.allowPlayer(player));
            else proms.push( r.excludePlayer(player) );
        });

        await Promise.all(proms);
    }

    //Starts the game
    async start() : Promise<void>
    {
        console.log("Starting the game");

        let promises = [];
        this.internal.players.forEach( p => promises.push(this.resyncPlayerRoomPermissions(p)));

        await Promise.all(promises);
        
        console.log("Done");
    }
}