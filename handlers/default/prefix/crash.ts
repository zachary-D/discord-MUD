import * as Discord from "discord.js";

import * as relayManager from "../../../modules/relayManager";

module.exports = {
    name: 'crash',
    description: '',
    aliases: [],
    //Comment out permissions/channel/server requirements if you want it to run everywhere/by everyone/etc
    permissions: ["lore"],
    // inChannelID: [],
    // inChannelName: [],
    // inServerID: [],
    // inServerName: [],
    //Configures the rate limit.  The rate limit period is in second (set to 0 to disable).
    //RateLimitUser is the rate limit for individuals per period.  ..Global is the same except it is shared for all users.  The global rate limit can be disabled with -1
    rateLimitPeriod: 5,
    rateLimitUser: 1,
    rateLimitGlobal: -1,
    async execute(msg : Discord.Message, args : Array<string>) {
        await relayManager.relay("/home/broadcast/git_repos/primetime!/modules/reverse-relay.ts:21\n                                 ^\nTypeError: Cannot read property 'id' of undefined\n    at Client.Relay.handleMessage (/home/broadcast/git_repos/primetime!/modules/reverse-relay.ts:21:40)\n    at Client.emit (events.js:208:15)\n    at MessageCreateHandler.handle (/home/broadcast/git_repos/primetime!/node_modules/discord.js/src/client/websocket/packets/handlers/MessageCreate.js:9:34)\n    at WebSocketPacketManager.handle (/home/broadcast/git_repos/primetime!/node_modules/discord.js/src/client/websocket/packets/WebSocketPacketManager.js:105:65)\n    at WebSocketConnection.onPacket (/home/broadcast/git_repos/primetime!/node_modules/discord.js/src/client/websocket/WebSocketConnection.js:333:35)\n    at WebSocketConnection.onMessage (/home/broadcast/git_repos/primetime!/node_modules/discord.js/src/client/websocket/WebSocketConnection.js:296:17)\n    at WebSocket.onMessage (/home/broadcast/git_repos/primetime!/node_modules/ws/lib/event-target.js:120:16)\n    at WebSocket.emit (events.js:203:13)\n    at Receiver.receiverOnMessage (/home/broadcast/git_repos/primetime!/node_modules/ws/lib/websocket.js:789:20)\n    at Receiver.emit (events.js:203:13)\n", msg.channel as Discord.TextChannel);
        await relayManager.relay("Fatal: undefined.  System halt.", msg.channel as Discord.TextChannel);
    }
}