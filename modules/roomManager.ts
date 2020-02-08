import * as Discord from "discord.js";

import {client} from "../Discord-Bot-Core/bot";
import {Game} from "../src/Game";
import {Room} from "../src/Room";
import {Player} from "../src/Player";

export let game : Game;

let alreadyInit = false;

client.on("ready", () => {
    //Only initialize once
    if(alreadyInit) return;

    game = new Game("674494731656364042");
    game.start();
    alreadyInit = true;
});

client.on("message", async (msg) => {
    game.handleMessage(msg);
});