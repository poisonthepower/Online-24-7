
let endpoint = window.GLOBAL_ENV.API_ENDPOINT;
let apiVersion = window.GLOBAL_ENV.API_VERSION;

let apiUrl = 'https:' + endpoint + '/v' + apiVersion + '/';
console.log('API URL: ' + apiUrl);
console.log('API User Me: ' + apiUrl + 'users/@me');

let token = (process.env.TOKEN);

/**
 * HELPER FUNCTIONS
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Discord API
 */
async function getUserData() {
    let response = await fetch(apiUrl + 'users/@me', {
        method: 'GET',
        headers: {
            "Authorization": token,
            "Content-Type": 'application/json;charset=utf-8'
        },
    });

    /**
     {
       "id":"111111111111",
       "username":"John Doe",
       "avatar":null,
       "avatar_decoration":null,
       "discriminator":"11111111",
       "public_flags":0,
       "flags":0,
       "banner":null,
       "banner_color":"#f7c00d",
       "accent_color":16236557,
       "bio":"",
       "locale":"en-US",
       "nsfw_allowed":true,
       "mfa_enabled":false,
       "premium_type":0,
       "email":"example@example.com",
       "verified":true,
       "phone":""
    }*/
    let userData = await response.json();

    console.log('User Data');
    console.log(userData);

    console.log('User Id: ' + userData.id);
    console.log('User Name: ' + userData.username);
    console.log('Discriminator: ' + userData.discriminator);
}

/**
 * Discord Socket / Gateway
 */

let socketEndPoint = "wss://gateway.discord.gg/?v=" + apiVersion + "&encoding=json"
let socket, receviedData, heartbeat_interval;

async function discordWebSocketConnection() {
    socket = new WebSocket(socketEndPoint);
    socket.onmessage = function (event) { //socket response
        console.log('onmessage');
        //console.log(event);
        receviedData = JSON.parse(event.data);
        console.log(receviedData);

        if (typeof receviedData?.d?.heartbeat_interval != "undefined") {
            //respose after socket connected
            //{"t":null,"s":null,"op":10,"d":{"heartbeat_interval":11111,"_trace":["[\"gateway-prd-us-east1-d-xlm7\",{\"micros\":0.0}]"]}}
            console.log("heartbeat_interval: " + receviedData.d.heartbeat_interval);
            heartbeat_interval = receviedData.d.heartbeat_interval;
        }
    };
    socket.onclose = function (event) { //socket closed
        console.log('onclose');
        console.log(event);
    }
    socket.onerror = function (error) { //socket error response
        console.log('onerror');
        console.log(error);
    };

    do {
        /**
         0 – “CONNECTING”: the connection has not yet been established,
         1 – “OPEN”: communicating,
         2 – “CLOSING”: the connection is closing,
         3 – “CLOSED”: the connection is closed.
         **/
        console.log('socket connecting...');
        await sleep(5000);
        if (socket.readyState == 1) {
            console.log('socket connected');
        }
        console.log("Socket Status: " + socket.readyState);
    } while (socket.readyState != 1)
}

async function socketWakeUp() {
    if (socket.readyState != 1) {
        console.log('socket reconnecting...');
        await discordWebSocketConnection();
    }
}

async function discordIdentify() { //https://discord.com/developers/docs/topics/gateway-events#identify-identify-structure
    await socketWakeUp();
    const data = {
        "op": 2, //
        "d": {
            "token": token,
            "properties": {
                "os": "Windows 10",
                "browser": "desktop",
                "device": "windows"
            },
            "presence": {
				"activities": [{
					"name": "Don't dm me",
					"type": 0
				 }],
                "status": "online",
                "afk": false
            }
        },
        "s": "None",
        "t": "None"
    };
    socket.send(JSON.stringify(data));
    console.log('send identitfy');
}

async function updateDiscordStatusOnline() { //https://discord.com/developers/docs/topics/gateway-events#update-presence-gateway-presence-update-structure
    await socketWakeUp();
    const data = {
        "op": 3,
        "d": {
            "activities": [],
			//"activities": [{
				//"name": "Hello",
				//"type": 2 //type = 1 playing, type = 2 listening
			//}],
            "since": null,
            "status": "online",
            "afk": false
        }
    }
    socket.send(JSON.stringify(data));
    console.log('Discord status has updated');
}

async function discordHeartbeat() { //https://discord.com/developers/docs/topics/gateway-events#heartbeat
    console.log('waiting heartbeat interval');
    await sleep(heartbeat_interval);
    console.log('heartbeat interval OK');
    await socketWakeUp();
    const data = {
        "op": 1,
        "d": null
    }
    socket.send(JSON.stringify(data));
    console.log('discord gateway reactivated');
}

async function main() {
    await discordWebSocketConnection();
    await sleep(1000);

    await getUserData();
    await sleep(1000);

    await discordIdentify();
    
    while (true) {
        await updateDiscordStatusOnline();
        await discordHeartbeat();
        await sleep(10000);
    }
}

main();
