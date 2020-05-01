import * as Discord from "discord.js";
import { assert } from "console";

import { client } from "../Discord-Bot-Core/bot";

import { Room } from "./Room";
import { Player } from "./Player";
import { GameMap } from "./GameMap";

//The name of the role that all game members have
const DEFAULT_PLAYER_ROLE_NAME = "Participants";

//The name of the channel containing info (i.e. how to use the bot) that is in the category but should not be treated as a room
// const DEFAULT_INFO_CHANNEL_NAME = "map-info";


const DEFAULT_CATEGORY_CHANNEL_NAME = "the-map";

export enum GameStatus {
    notStarted = "notStarted",
    inProgress = "inProgress",
    done = "finished"
}

//A game
export class Game {
    //The category channel that contains the other rooms
    categoryChannel : Discord.CategoryChannel;

    //The guild this game takes place in
    guild : Discord.Guild;

    //The role all players of this game have
    playerRole : Discord.Role;
    lastPlayerID = 0;

    //The players in this game
    players = new Discord.Collection<Discord.Snowflake, Player>();

    map: GameMap;

    //The status of the game
    status : GameStatus;

    //The filename used when saving the game
    saveName: string;

    constructor(data?: Partial<Game>) {
        Object.assign(this, data);
    }

    static async createNewGame(guild: Discord.Guild, saveName: string, mapName: string): Promise<Game> {
        const game = new Game();
        game.guild = guild;
        game.saveName = saveName;
        game.status = GameStatus.notStarted;
        game.map = await GameMap.loadMapFromFile(mapName);
        //TODO: Create category channel if missing
        //TODO: Create player role if missing
        return game;
    }

    static loadFromJSONObject(jsonObject: Object): Game {
        const game = new Game(jsonObject);

        //TODO: assert() doesn't error on failure LMAO need to replace it

        assert(game.status != null);

        game.guild = client.guilds.get(game.guild.id);
        assert(game.guild != null);

        game.categoryChannel = game.guild.channels.get(game.categoryChannel.id) as Discord.CategoryChannel;
        assert(game.categoryChannel.type == "category");

        game.playerRole = game.guild.roles.get(game.playerRole.id);
        assert(game.playerRole != null);

        //TODO: load map
        //Need to load rooms first bc players reference rooms
        // game.rooms = new Discord.Collection<number, Room>(game.rooms);
        // assert(game.rooms);

        //TODO: load game players
        // game.players = new Discord.Collection<Discord.Snowflake, Player>(game.players)
        //     .map( (p: Player) => Player.loadFromJSONObject(p, game));
        assert(game.players != null);

        

        return game;
    }

    // //Returns true if this map contains the channel passed to it 
    // doesContain(ch : string | Discord.TextChannel) : boolean {

    //     //Convert TextChannel objects to IDs
    //     if(ch instanceof Discord.TextChannel)
    //     {
    //         ch = ch.id;
    //     }

    //     for(let i = 0; i < this.rooms.array().length; i++)
    //     {
    //         if(this.rooms.array()[i].channel.id == ch) return true;
    //     }

    //     return false;
    // }

    //Returns the room with the name matching `name`
    // getRoomByName(name : string) : Room {
        
    //     //Format the incoming name
    //     {
    //         name = name.trim();

    //         while(name.startsWith("#"))
    //         {
    //             name = name.substr(1);
    //         }
    //     }

    //     let room : Room = this.rooms.find( (r) => r.name === name );

    //     if(room == undefined) throw new Error("Room not found");

    //     return room;
    // }

    //Returns the room linked to the given channel
    // getRoomByChannel(ch : string | Discord.GuildChannel) : Room {
    //     let id : string;

    //     if(ch instanceof Discord.GuildChannel)
    //     {
    //         id = ch.id;
    //     }
    //     else    //Assume it's a string
    //     {
    //         id = ch; 
    //     }

    //     let room : Room = this.rooms.find( (r) => r.channel.id == id);

    //     if(room == undefined) throw new Error("Room not found");

    //     return room;
    // }

    //Returns the player for a given user
    getPlayer(p : Discord.Snowflake | Discord.User) : Player
    {
        if(p instanceof Discord.User)
        {
            p = p.id;
        }
        
        let player : Player = this.players.get(p);

        if(player == undefined) throw new Error("Player not found");

        return player;
    }

    //Returns a list of players in a given room
    getPlayersInRoom(room : Room) : Player[] {
        return this.players.filter( p => p.currentRoom == room).array();
    }

    //Handles a message
    // async handleMessage(msg : Discord.Message) : Promise<void> {
    //     if(msg.channel instanceof Discord.DMChannel)
    //     {
    //         //handle commands via DM in the future
    //     }
    //     else if(msg.channel instanceof Discord.TextChannel)
    //     {
    //         //Ignore messages outside the guild containing this game
    //         if(msg.guild === this.guild)
    //             this.getRoomByChannel(msg.channel).handleMessage(msg);
    //     }
    // }

    //Moves a player from one room to another
    async movePlayer(player : Player, from : Room, to : Room)
    {
        //TODO: potentially move players to limbo first
        await to.playerEntered(player);
        await from.playerLeft(player);
    }

    // async resyncPlayerRoomPermissions(player : Player) : Promise<void>
    // {
    //     let proms : Promise<unknown>[] = [];

    //     this.rooms.forEach( r => {
    //         if(r == player.currentRoom) proms.push(r.allowPlayer(player));
    //         else proms.push( r.excludePlayer(player) );
    //     });

    //     await Promise.all(proms);
    // }

    //Starts the game
    async start() : Promise<void>
    {
        console.log("Starting the game");

        let promises = [];
        // this.players.forEach( p => promises.push(this.resyncPlayerRoomPermissions(p)));

        await Promise.all(promises);
        
        console.log("Done");
    }
}