import * as Discord from "discord.js";

import {client} from "../Discord-Bot-Core/bot";

import * as version from "../version.json";

const triggerLen = 50;
const charMap = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@$%^&";

let triggerPhrase : string;

export enum SystemState {
    normal,
    system
};

export let state : SystemState = SystemState.normal;

async function generateNewTriggerPhrase()
{
    triggerPhrase = "";

    for(let i = 0; i < triggerLen; i++)
    {
        triggerPhrase += charMap.charAt(Math.random() * charMap.length);
    }
}

generateNewTriggerPhrase();

client.on("message", async (msg) => {

    //If I am the author
    if(msg.author.id === "227600936061763604")
    {
        if(msg.channel.type === "dm")
        {
            
                if(msg.cleanContent === "!phrase")
                {
                    await generateNewTriggerPhrase();
                    msg.reply(triggerPhrase);
                }
                else
                {
                    //Handle other commands in the future
                }
        }
        else if(msg.channel.type === "text")
        {
            if(state === SystemState.normal)
            {
                if(msg.cleanContent === triggerPhrase)
                {
                    state = SystemState.system;
                    await msg.channel.send("[SYSTEM] N-Network suspended.  Control returned to hypervisor.\n$SYSTEM >");
                    await generateNewTriggerPhrase();
                }
            }
            else if(state === SystemState.system)
            {
                if(msg.cleanContent.startsWith("$update fetch"))
                {
                    await msg.channel.send("[SYSTEM] Fetching update");
                    setTimeout( async () => {
                        await msg.channel.send("[SYSTEM] Done.\n$SYSTEM >");
                    }, 2500)
                }
                else if(msg.cleanContent === "$update apply")
                {
                    await msg.channel.send("[SYSTEM] Applying update...");
                    setTimeout( async () => {
                        await msg.channel.send(`[SYSTEM] Done.\nVersion: ${version}\n$SYSTEM >`);
                    }, 2500)
                }
                else if(msg.cleanContent === "$resume")
                {
                    state = SystemState.normal;
                    await msg.channel.send("[SYSTEM] N-Network resumed.  Returning to normal operation.")
                }
            }
        }
    }
});