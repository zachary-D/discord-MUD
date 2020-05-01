import * as _fsRaw from "fs";
const fsPromise = _fsRaw.promises;

import * as Discord from "discord.js";

import {Room, RoomLink} from "./Room";

const MAPS_FOLDER_PATH = "../data/maps/";

/*

Game Map save-object file format (.map)

{
	lastRoomID: number;
	rooms: Room[];
	links: RoomLinks[];
}

*/

export class GameMap {
	//The rooms contained within the map
	rooms = new Discord.Collection<number, Room>();

	lastRoomID = 0;

	constructor(data?: Partial<GameMap>) {
		Object.assign(this, data);
	}

	static async loadMapFromFile(mapName: string): Promise<GameMap> {

		const fileDataText: string = await fsPromise.readFile(`${MAPS_FOLDER_PATH}${mapName}`, { encoding: "utf8" });
		const fileObject = JSON.parse(fileDataText);
		
		if(!fileObject) throw new Error("File does not parse to an object!");

		//TODO: Add fully descriptive error messages at some point, this will do for now
		if( !(fileObject.rooms instanceof Array)) throw new Error("File format invalid");
		if( !(fileObject.links instanceof Array)) throw new Error("File format invalid");

		const map = new GameMap();

		//Load the rooms
		for(const roomRaw of fileObject.rooms) {
			const room = new Room(roomRaw);
			if(room.id < 0) {
				console.log(`WARN: Invalid room ID: ${room.id}.  Ignoring and continuing`);
				continue;
			}

			if(map.rooms.has(room.id)) {
				console.log(`WARN: Duplicate room ID: ${room.id}.  Ignoring and continuing`);
				continue;
			}

			map.rooms.set(room.id, room);
		}
		
		//Load the room links
		for(const linkRaw of fileObject.links) {
			const link = new RoomLink(linkRaw);
			
		}
	}

	saveMap(outFileName: string) {

	}
}