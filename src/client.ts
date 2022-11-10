import { Data, ResponseData } from "./types";

const net = require('net');

//Configuration ===================================
const port = 8888;
//=================================================

//================= Client 1 ==========================
//Create the socket client.
const client1 = new net.Socket();

function displayMessage(data: ResponseData["data"]) {
    console.log("New message from", data.from);
    console.log(data.message);
}

//Connect to the server on the configured port
client1.connect(port,function(){
    //Log when the connection is established
    console.log("Connected to server");
    client1.on('data', (jsonStr) => {
        const json: ResponseData = JSON.parse(jsonStr);

        if (!json) {
            console.error("Error parsing json", jsonStr);
            return;
        }

        switch (json.type) {
            case "message":
                displayMessage(json.data);
                break;
            default:
                console.log(json);
        }
    });
});


import readline from "readline";

const terminal = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const askUser = async (question: string) =>
    new Promise<string>((resolve) => {
        terminal.question(question, (txt) => {
            resolve(txt.trimRight());
        });
    });

const main = async () => {
    while (true) {
        const id = await askUser("Send a message to?");
        const message = await askUser("Message?");

        client1.write(JSON.stringify({ type: "message", data: { to: id, message }}))
    }
}

main();
