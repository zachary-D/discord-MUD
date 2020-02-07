import * as Discord from "discord.js";

import {client} from "../Discord-Bot-Core/bot";

//The name of the role that all game members have
const playerRoleName = "Participants";

//The name of the channel containing info (i.e. how to use the bot) that is in the category but should not be treated as a room
const infoChannelName = "the-map";

//The name of the channel that players occupy by default
const defaultChannelName = "limbo";

// let gameInstances = new Discord.Collection<string, Game>();

export let game : Game;

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
        this.learnRoom(this.currentRoom);
    }

    //Displays the rooms a user knows to the  user
    async displayKnownRooms(msg : Discord.Message) : Promise<void> {
        const embed = new Discord.RichEmbed;
        
        embed.setTitle(`Rooms known to \`${msg.member.displayName}\``);
        embed.addField("Rooms", '`' + this.getKnownRooms().join("`\n`") + '`');

        await msg.reply(embed);
    }

    //Returns a list of room names this player
    getKnownRooms() : string[] {
        // return this.knownRooms.array().map( r => {
        //     return r.channel.name;
        // });
        return this.game.rooms.array().map( r => r.channel.name).sort();
    }

    //Marks the room as 'known'
    learnRoom(room : Room)
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

        //TODO: finish the linked-rooms system and enable this check
        // if(this.knownRooms.get(room.channel.id) == undefined) throw new Error("room unknown to player");

        await this.game.movePlayer(this, this.currentRoom, room);
        this._currentRoom = room;

        room.connectedRooms.forEach( r => {
            this.learnRoom(r);
        })
    }
}

//A room players can enter
export class Room {
    //The rooms connected to this one
    connectedRooms : Room[] = [];

    //The game this room belongs to
    protected _game : Game;

    //The channel for this room
    protected textChannel : Discord.TextChannel;

    //If this room can be entered
    protected locked : boolean;

    //If this room is visible (appears on room lists)
    protected visible : boolean;

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

    get isVisible() : boolean {
        return this.visible;
    }

    get game() : Game {
        return this._game;
    }

    constructor(category : string | Discord.TextChannel, game : Game)
    {
        if(category instanceof Discord.TextChannel)
        {
            this.textChannel = category;
        }
        else    //Assume it's a string
        {
            this.textChannel = client.channels.get(category) as Discord.TextChannel;
        }

        console.log(`New room instance in ${this.channel.name}`);

        if(this.channel.type != "text") throw new Error("The channel is not a text channel");

        this._game = game;
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
}

// //Returns the map instance for the guild or TextChannel passed to it (also works by ID)
// export function getGameFor(id : string | Discord.TextChannel | Discord.Guild) : Game
// {
//     //Convert guild & channel objects to IDs
//     if(id instanceof Discord.Guild)
//     {
//         id = id.id;
//     }
//     else if(id instanceof Discord.TextChannel)
//     {
//         id = id.id;
//     }
//     else    //Assume string
//     {
//         //do nothing, it's already what we want
//     }

//     let instance = gameInstances.get(id);

//     //If we find a Game attached directly to this channel, return it
//     if(instance != null) return instance;

//     //Otherwise, we must check the rooms themselves for ID matches
//     for(let i = 0; i < gameInstances.array().length; i++)
//     {
//         if(gameInstances.array()[i].doesContain(id)) return gameInstances.array()[i];
//     }

//     throw "No matching Game instance found!";
// }

let alreadyInit = false;

client.on("ready", () => {
    //Only initialize once
    if(alreadyInit) return;

    game = new Game("668154769956929536");
    alreadyInit = true;

    testSetup(game);
});

client.on("message", async (msg) => {
    game.handleMessage(msg);
});

function sleep(ms : number) : Promise<void>
{
    return new Promise( (resolve, reject) => {
        setTimeout(resolve, ms);
    });
}

async function testSetup(map : Game) {

    let maskMan = map.guild.members.get("673743857908973588");

    // await map.excludeMemberFromAllRooms(maskMan);

    await sleep(1000);

    let mafia = map.getRoomByName("detectives");

    // mafia.playerEntered(maskMan);

    console.log("Test sequence complete");
}

// export async function moveToRoom(member : Discord.GuildMember, fromChannel : Discord.TextChannel, toChannel : string | Discord.TextChannel)
// {
//     const map = getGameFor(fromChannel);

//     let dest : Room;

//     if(toChannel instanceof Discord.TextChannel)
//     {
//         dest = map.getRoomByChannel(toChannel);
//     }
//     else
//     {
//         dest = map.getRoomByName(toChannel);
//     }

//     if(dest.isLocked) throw new Error("destination is locked");

//     //Move the user into the destination first, to ensure users cannot be stranded
//     await dest.playerEntered(member);
//     await map.getRoomByChannel(fromChannel).playerLeft(member);
// }