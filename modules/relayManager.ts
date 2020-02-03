import * as Discord from "discord.js";

import * as system from "./system";

let corruptionLevel = 0;

export function getCorruptionLevel() : number
{
    return corruptionLevel;
}

export function setCorruptionLevel(level : number)
{
    corruptionLevel = level;
}

//Zalgo-ifyer modified from http://textozor.com/zalgo-text/scriptz.js

	// data set of leet unicode chars
	//---------------------------------------------------

	//those go UP
	var zalgo_up = [
		'\u030d', /*     Ì     */		'\u030e', /*     ÌŽ     */		'\u0304', /*     Ì„     */		'\u0305', /*     Ì…     */
		'\u033f', /*     Ì¿     */		'\u0311', /*     Ì‘     */		'\u0306', /*     Ì†     */		'\u0310', /*     Ì     */
		'\u0352', /*     Í’     */		'\u0357', /*     Í—     */		'\u0351', /*     Í‘     */		'\u0307', /*     Ì‡     */
		'\u0308', /*     Ìˆ     */		'\u030a', /*     ÌŠ     */		'\u0342', /*     Í‚     */		'\u0343', /*     Ì“     */
		'\u0344', /*     ÌˆÌ     */		'\u034a', /*     ÍŠ     */		'\u034b', /*     Í‹     */		'\u034c', /*     ÍŒ     */
		'\u0303', /*     Ìƒ     */		'\u0302', /*     Ì‚     */		'\u030c', /*     ÌŒ     */		'\u0350', /*     Í     */
		'\u0300', /*     Ì€     */		'\u0301', /*     Ì     */		'\u030b', /*     Ì‹     */		'\u030f', /*     Ì     */
		'\u0312', /*     Ì’     */		'\u0313', /*     Ì“     */		'\u0314', /*     Ì”     */		'\u033d', /*     Ì½     */
		'\u0309', /*     Ì‰     */		'\u0363', /*     Í£     */		'\u0364', /*     Í¤     */		'\u0365', /*     Í¥     */
		'\u0366', /*     Í¦     */		'\u0367', /*     Í§     */		'\u0368', /*     Í¨     */		'\u0369', /*     Í©     */
		'\u036a', /*     Íª     */		'\u036b', /*     Í«     */		'\u036c', /*     Í¬     */		'\u036d', /*     Í­     */
		'\u036e', /*     Í®     */		'\u036f', /*     Í¯     */		'\u033e', /*     Ì¾     */		'\u035b', /*     Í›     */
		'\u0346', /*     Í†     */		'\u031a' /*     Ìš     */
	];

	//those go DOWN
	var zalgo_down = [
		'\u0316', /*     Ì–     */		'\u0317', /*     Ì—     */		'\u0318', /*     Ì˜     */		'\u0319', /*     Ì™     */
		'\u031c', /*     Ìœ     */		'\u031d', /*     Ì     */		'\u031e', /*     Ìž     */		'\u031f', /*     ÌŸ     */
		'\u0320', /*     Ì      */		'\u0324', /*     Ì¤     */		'\u0325', /*     Ì¥     */		'\u0326', /*     Ì¦     */
		'\u0329', /*     Ì©     */		'\u032a', /*     Ìª     */		'\u032b', /*     Ì«     */		'\u032c', /*     Ì¬     */
		'\u032d', /*     Ì­     */		'\u032e', /*     Ì®     */		'\u032f', /*     Ì¯     */		'\u0330', /*     Ì°     */
		'\u0331', /*     Ì±     */		'\u0332', /*     Ì²     */		'\u0333', /*     Ì³     */		'\u0339', /*     Ì¹     */
		'\u033a', /*     Ìº     */		'\u033b', /*     Ì»     */		'\u033c', /*     Ì¼     */		'\u0345', /*     Í…     */
		'\u0347', /*     Í‡     */		'\u0348', /*     Íˆ     */		'\u0349', /*     Í‰     */		'\u034d', /*     Í     */
		'\u034e', /*     ÍŽ     */		'\u0353', /*     Í“     */		'\u0354', /*     Í”     */		'\u0355', /*     Í•     */
		'\u0356', /*     Í–     */		'\u0359', /*     Í™     */		'\u035a', /*     Íš     */		'\u0323' /*     Ì£     */
	];
	
	//those always stay in the middle
	var zalgo_mid = [
		'\u0315', /*     Ì•     */		'\u031b', /*     Ì›     */		'\u0340', /*     Ì€     */		'\u0341', /*     Ì     */
		'\u0358', /*     Í˜     */		'\u0321', /*     Ì¡     */		'\u0322', /*     Ì¢     */		'\u0327', /*     Ì§     */
		'\u0328', /*     Ì¨     */		'\u0334', /*     Ì´     */		'\u0335', /*     Ìµ     */		'\u0336', /*     Ì¶     */
		'\u034f', /*     Í     */		'\u035c', /*     Íœ     */		'\u035d', /*     Í     */		'\u035e', /*     Íž     */
		'\u035f', /*     ÍŸ     */		'\u0360', /*     Í      */		'\u0362', /*     Í¢     */		'\u0338', /*     Ì¸     */
		'\u0337', /*     Ì·     */		'\u0361', /*     Í¡     */		'\u0489' /*     Ò‰_     */		
	];
	
	// rand funcs
	//---------------------------------------------------
	
	//gets an int between 0 and max
	function rand(max)
	{
		return Math.floor(Math.random() * max);
	}

	//gets a random char from a zalgo char table
	function rand_zalgo(array)
	{
		var ind = Math.floor(Math.random() * array.length);
		return array[ind];
	}
	
	// utils funcs
	//---------------------------------------------------
	
	//hide show element

	
	//lookup char to know if its a zalgo char or not
	function is_zalgo_char(c)
	{
		var i;
		for(i=0; i<zalgo_up.length; i++)
			if(c == zalgo_up[i])
				return true;
		for(i=0; i<zalgo_down.length; i++)
			if(c == zalgo_down[i])
				return true;
		for(i=0; i<zalgo_mid.length; i++)
			if(c == zalgo_mid[i])
				return true;
		return false;
	}
	

	
	// main shit
	//---------------------------------------------------
	function zalgo(txt)
	{
		var newText = '';
			
		for(var i=0; i<txt.length; i++)
		{
			if(is_zalgo_char(txt.substr(i, 1)))
				continue;
			
			var num_up;
			var num_mid;
			var num_down;
			
			//add the normal character
			newText += txt.substr(i, 1);

			//options
			// if(document.getElementById('zalgo_opt_mini').checked)
			// {
			// 	num_up = rand(8);
			// 	num_mid = rand(2);
			// 	num_down = rand(8);
			// }
			// else if(document.getElementById('zalgo_opt_normal').checked)
			// {
				num_up = rand(16) / 2 + 1;
				num_mid = rand(6) / 2;
				num_down = rand(16) / 2 + 1;
			// }
			// else //maxi
			// {
			// 	num_up = rand(64) / 4 + 3;
			// 	num_mid = rand(16) / 4 + 1;
			// 	num_down = rand(64) / 4 + 3;
			// }
			
			
			// if(document.getElementById('zalgo_opt_up').checked)
				for(var j=0; j<num_up; j++)
					newText += rand_zalgo(zalgo_up);
			// if(document.getElementById('zalgo_opt_mid').checked)
				for(var j=0; j<num_mid; j++)
					newText += rand_zalgo(zalgo_mid);
			// if(document.getElementById('zalgo_opt_down').checked)
				for(var j=0; j<num_down; j++)
					newText += rand_zalgo(zalgo_down);
		}

		//result is in newText, display that
		
		//remove all children of zalgo_container
		// var container = document.getElementById('zalgo_container');
		// while(container.childNodes.length)
		// 	container.removeChild(container.childNodes[0]);

		//build blocks for each line & create a <br />
		// var lines = newText.split("\n");
		// for(var i=0; i<lines.length; i++)
		// {
		// 	var n = document.createElement('text');
		// 	n.innerHTML = lines[i];
		// 	container.appendChild(n);
		// 	var nl = document.createElement('br');
		// 	container.appendChild(nl);
		// }

        //done
        return newText;
	}




const chDestName = "announcements";

const charMapSrc = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const charMapDst = "ab̧̀c̨̲̿͞d͈̭̎̓e̼͈͙͋̽̓͜͡fgh̍ͅȋ̥͍͘j̝̱͎͊͗͢͡͠k̢͚͕̑̊͋̕͜lm̼̖̒̌n̖̍̽͢o̞̗̣̳̖̊̈́͗̉̚p̨͓̘̐̎̍q̦̗͔̏͂̎r̡̘̔͝s̜̭̳̗̈́̌̐͌t̳̅ų͓͗̐v̻̼̓́w̦͔̑͠x͚͔̲͂́͗y̨̙͔̎̔̀z̺̝̾̄0̞̰́̉1̨̥̇̐2͓͈͉̾̀̌͒͢34̡͙͇̍̆͝5͓͕͓̌̎͒6͖̌7̣̟̇͊̏͢89͓̍A͕̕B͔̣͊̔C̞̋Ḋ̥Ȇ͖̟͍̏̉F̮͌G̫̍̓͜H̲̰̭̿̋͘̕͟I̛̟̱͜͞͞J̳̩̯͐͛́KL̛̗M̠͊N̰̲̤̾̌̓O̼̘̤̊̎͂͘͜P̫̔Q͇͚̰̱̐́̎̊RS̨͖͎̮̯͒̂̀͘͝T͇̣̳̈͊͂U͐ͅV̪̏W̭̝͉̝͊͗͂̑̒͢X̫̕Y͓͙̩̋̃̿Z̡͕̭̺͒̀̚̕";

let corruptionPercent = 0;

//broken
//Corrupts a character
function corruptChar(char : string) : string {
    let i = charMapSrc.indexOf(char);
    if(i == -1) return char;

    let pre = charMapDst[i-1];
    let post = charMapDst[i+1];
    let actual = charMapDst[i];
    return charMapDst[i];
}

function corruptString(str : string) : string {
    let out = "";

    for(let i = 0; i < str.length; i++)
    {
        const char = str[i];

        const rand = Math.random() * 100;
        const corr = getCorruptionLevel();
        let newChar;
        if(rand <= corr)
            newChar = zalgo(char);
        else
            newChar = char;
        out += newChar;
    }

    return out;
}

export async function relay(content : string, srcChannel : Discord.TextChannel)
{
	if(system.state != system.SystemState.normal) return;

    const chPrefix = "relay-";
    const targetChName = srcChannel.name.substr(srcChannel.name.indexOf(chPrefix) + chPrefix.length);
    const channelOut = srcChannel.guild.channels.find( (ch) => ch.name === targetChName) as Discord.TextChannel;

    if(channelOut == undefined)
    {
        await srcChannel.send("Error: Unable to locate destination channel!");
        return;
    }

    await channelOut.send(corruptString(content));
}