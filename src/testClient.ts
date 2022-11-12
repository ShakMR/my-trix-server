import { ResponseMessage } from "./types";
import readline from "readline";
import Client from "./Client";

const port = 8888;
//=================================================

//================= Client 1 ==========================
const client = new Client({ port });

function displayMessage(data: ResponseMessage["data"]) {
    console.log(data);
    console.log("New message from", data.from);
    console.log(data.message);
}

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
    client.subscribe(displayMessage);
    await client.connect();
    while (true) {
        const id = parseInt(await askUser("Send a message to?"), 10);
        const message = await askUser("Message?");

        client.send({ type: "message", data: { to: id, message }})
    }
}

main();
