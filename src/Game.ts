import * as Discord from "discord.js";

import {client} from "../Discord-Bot-Core/bot";
import {Room} from "./Room";
import {Player} from "./Player";

//The name of the role that all game members have
const playerRoleName = "Participants";

//The name of the channel containing info (i.e. how to use the bot) that is in the category but should not be treated as a room
const infoChannelName = "the-map";

//A game
export class Game {
    //The category channel that contains the other rooms
    protected categoryChannel : Discord.CategoryChannel;

    //The guild this game takes place in
    protected _guild : Discord.Guild;

    protected players = new Discord.Collection<Discord.Snowflake, Player>();

    get guild() : Discord.Guild {
        return this._guild
    }

    //The role all players of this game have
    protected playerRole : Discord.Role;
    
    //The rooms contained within the map
    rooms = new Discord.Collection<string, Room>();

    constructor(category : string | Discord.CategoryChannel)
    {
        //Get the CategoryChannel object
        if(category instanceof Discord.CategoryChannel)
        {
            this.categoryChannel = category;
        }
        else    //Assume it is a string 
        {
            this.categoryChannel = client.channels.get(category) as Discord.CategoryChannel;
        }

        console.log(`Creating a Game in ${ this.categoryChannel.name }`)

        if(this.categoryChannel.type != "category") throw new Error("The channel given is not a category channel");

        //Set the guild
        this._guild = this.categoryChannel.guild;

        //Spawn all child-channels as Rooms
        for(let i = 0; i < this.categoryChannel.children.array().length; i++)
        {
            //Skip the info-channel
            if(this.categoryChannel.children.array()[i].name === infoChannelName) continue;

            //Skip VCs, or anything else that made its way into the mix by accident
            if(this.categoryChannel.children.array()[i].type != "text") continue;

            this.rooms.set(
                this.categoryChannel.children.array()[i].id,
                new Room(this.categoryChannel.children.array()[i] as Discord.TextChannel, this)
            );
        }

        //Find the player role
        this.playerRole = this.guild.roles.find( (r) => r.name == playerRoleName);
        if(this.playerRole == undefined) throw new Error("Player role not found");

        this.playerRole.members.forEach( m => {
            this.players.set(m.id, new Player(m, this));
        })

        // gameInstances.set(this.guild.id, this);
    }

    //Returns true if this map contains the channel passed to it 
    doesContain(ch : string | Discord.TextChannel) : boolean {

        //Convert TextChannel objects to IDs
        if(ch instanceof Discord.TextChannel)
        {
            ch = ch.id;
        }

        for(let i = 0; i < this.rooms.array().length; i++)
        {
            if(this.rooms.array()[i].channelID == ch) return true;
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

        let room : Room = this.rooms.find( (r) => r.channelName === name );

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

        let room : Room = this.rooms.find( (r) => r.channelID == id);

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
        
        let player : Player = this.players.get(p);

        if(player == undefined) throw new Error("Player not found");

        return player;
    }

    //Returns a list of players in a given room
    getPlayersInRoom(room : Room) : Player[] {
        return this.players.filter( p => p.currentRoom == room).array();
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

        this.rooms.forEach( r => {
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
        this.players.forEach( p => promises.push(this.resyncPlayerRoomPermissions(p)));

        await Promise.all(promises);
        
        console.log("Done");
    }
}