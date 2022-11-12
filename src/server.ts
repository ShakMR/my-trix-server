import net  from "net";
import crypto from "crypto";
import { TextMessage, SocketWithId } from "./types";
import JSONSocket from "./JSONSocket";

//Configuration ===================================
const port = 8888;
//=================================================

//Create an instance of the server and attach the client handling callback
const server = net.createServer(onClientConnection);

//Start listening on given port and host.
server.listen(port, function () {
  console.log(`Server started on port ${port}`);
});


let clients: Record<number, JSONSocket> = {}
//the client handling callback
function onClientConnection(sock: SocketWithId) {
  const jsonSocker = new JSONSocket(sock);

  jsonSocker.id = crypto.randomInt(0, 1000000);

  clients[jsonSocker.id] = jsonSocker;


  jsonSocker.write({ type: "init", data: { id: jsonSocker.id }});
  jsonSocker.on("data", function ({ type, data }: TextMessage) {
    const { to, message } = data;

    if (to in clients) {
      clients[to].write({ type: "message", data: { from: jsonSocker.id, message } });
    } else {
      jsonSocker.write({ type: "error", data: { message: "Message couldn't be delivered" }});
    }
  });

  sock.on("close", function () {
    clients[sock.id] = undefined;
    console.log(`${sock.remoteAddress}:${sock.remotePort} Connection closed`);
  });

  sock.on("error", function (error) {
    clients[sock.id] = undefined;
    console.error(
      `${sock.remoteAddress}:${sock.remotePort} Connection Error ${error}`
    );
  });
}
