import * as Discord from "discord.js";

import {client} from "../Discord-Bot-Core/bot";

//The name of the role that all game members have
const playerRoleName = "Participants";

//The name of the channel containing info (i.e. how to use the bot) that is in the category but should not be treated as a room
const infoChannelName = "the-map";

let mapInstances = new Discord.Collection<string, GameMap>();

//Returns the map instance for the guild or TextChannel passed to it (also works by ID)
export function getGameMapFor(id : string | Discord.TextChannel | Discord.Guild) : GameMap
{
    //Convert guild & channel objects to IDs
    if(id instanceof Discord.Guild)
    {
        id = id.id;
    }
    else if(id instanceof Discord.TextChannel)
    {
        id = id.id;
    }
    else    //Assume string
    {
        //do nothing, it's already what we want
    }

    let instance = mapInstances.get(id);

    //If we find a GameMap attached directly to this channel, return it
    if(instance != null) return instance;

    //Otherwise, we must check the rooms themselves for ID matches
    for(let i = 0; i < mapInstances.array().length; i++)
    {
        if(mapInstances.array()[i].doesContain(id)) return mapInstances.array()[i];
    }

    throw "No matching GameMap instance found!";
}


export class Room {
    //The channel for this room
    protected channel : Discord.TextChannel;

    get channelID() : string {
        return this.channel.id;
    }

    get channelName() : string {
        return this.channel.name;
    }

    constructor(category : string | Discord.TextChannel)
    {
        if(category instanceof Discord.TextChannel)
        {
            this.channel = category;
        }
        else    //Assume it's a string
        {
            this.channel = client.channels.get(category) as Discord.TextChannel;
        }

        console.log(`New room instance in ${this.channel.name}`);

        if(this.channel.type != "text") throw new Error("The channel is not a text channel");
    }

    //Allows a user to view this channel
    async allowMember(member : Discord.GuildMember)
    {
        let newPerms : Discord.PermissionOverwriteOptions = {
            READ_MESSAGES : true,
            SEND_MESSAGES : true,
            READ_MESSAGE_HISTORY : false
        }

        await this.channel.overwritePermissions(member, newPerms);
    }

    //Prevents a user from viewing this channel
    async excludeMember(member : Discord.GuildMember)
    {
        let newPerms : Discord.PermissionOverwriteOptions = {
            READ_MESSAGES : false,
            SEND_MESSAGES : false,
            READ_MESSAGE_HISTORY : false
        }

        await this.channel.overwritePermissions(member, newPerms);
    }

    //Sends the "user entered the room, current occupants" message and allows a user to view the channel
    async memberEntered(member : Discord.GuildMember)
    {
        await this.allowMember(member);

        await this.channel.send(`${member.displayName} entered the room`);

        //TODO: Build and send the 'entered, occupants' embed
    }

    //Sends the "user left the room" message and prevents a user from viewing the channel
    async memberLeft(member : Discord.GuildMember)
    {
        //Build and send the 'left' embed


        await this.excludeMember(member);
    }
}

export class GameMap {
    //The category channel that contains the other rooms
    protected categoryChannel : Discord.CategoryChannel;

    //The guild this game takes place in
    protected _guild : Discord.Guild;

    get guild() : Discord.Guild {
        return this._guild
    }

    //The role all players of this game have
    protected playerRole : Discord.Role;
    
    //The rooms contained within the map
    protected rooms = new Discord.Collection<string, Room>();

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

        console.log(`Creating a GameMap in ${ this.categoryChannel.name }`)

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
                new Room(this.categoryChannel.children.array()[i] as Discord.TextChannel)
            );
        }

        //Find the player role
        this.playerRole = this.guild.roles.find( (r) => r.name == playerRoleName);
        if(this.playerRole == undefined) throw new Error("Player role not found");

        mapInstances.set(this.guild.id, this);
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

    async excludeMemberFromAllRooms(member : Discord.GuildMember) : Promise<void>
    {
        let proms : Promise<unknown>[] = [];

        this.rooms.forEach( r => {
            proms.push( r.excludeMember(member) );
        });

        await Promise.all(proms);
    }
}

let alreadyInit = false;

client.on("ready", () => {
    //Only initialize once
    if(alreadyInit) return;

    let map = new GameMap("668154769956929536");
    alreadyInit = true;

    testSetup(map);
});

function sleep(ms : number) : Promise<void>
{
    return new Promise( (resolve, reject) => {
        setTimeout(resolve, ms);
    });
}

async function testSetup(map : GameMap) {

    let maskMan = map.guild.members.get("673743857908973588");

    await map.excludeMemberFromAllRooms(maskMan);

    await sleep(1000);

    let mafia = map.getRoomByName("detectives");

    mafia.memberEntered(maskMan);

    console.log("Test sequence complete");
}

export async function moveToRoom(member : Discord.GuildMember, fromChannel : Discord.TextChannel, toChannel : string | Discord.TextChannel)
{
    const map = getGameMapFor(fromChannel);

    let dest : Room;

    if(toChannel instanceof Discord.TextChannel)
    {
        dest = map.getRoomByChannel(toChannel);
    }
    else
    {
        dest = map.getRoomByName(toChannel);
    }

    await map.getRoomByChannel(fromChannel).memberLeft(member);
    await dest.memberEntered(member);
}