import * as Discord from "discord.js";

import {client} from "../Discord-Bot-Core/bot";
import {Game} from "../src/Game";
import {Room} from "../src/Room";
import {Player} from "../src/Player";



export let game : Game;

let alreadyInit = false;

client.on("ready", async () => {

    const server = client.guilds.get("668258316769689650");
    console.log(JSON.stringify(server));
    console.log(server.members);

    const game = await Game.createNewGame(server, "game1", "map1");

    const gameJSON = JSON.stringify(game, null, "\n");

    // const reconstructedGame = Game.loadFromJSON(gameJSON);

    return;
    //Only initialize once
    if(alreadyInit) return;

    // game = new Game("674494731656364042");
    // game.start();
    alreadyInit = true;
});

client.on("message", async (msg) => {
    // game.handleMessage(msg);
});