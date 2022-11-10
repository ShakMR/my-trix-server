import net  from "net";
import crypto from "crypto";
import { Data, SocketWithId } from "./types";

//Configuration ===================================
const port = 8888;
//=================================================

//Create an instance of the server and attach the client handling callback
const server = net.createServer(onClientConnection);

//Start listening on given port and host.
server.listen(port, function () {
  console.log(`Server started on port ${port}`);
});


let clients: Record<number, SocketWithId> = {}
//the client handling callback
function onClientConnection(sock: SocketWithId) {

  sock.id = crypto.randomInt(0, 1000000);

  clients[sock.id] = sock;

  sock.setKeepAlive(true,60000);

  sock.write(JSON.stringify({ type: "init", data: { id: sock.id }}));
  sock.on("data", function (d: Data) {
    const { data } = JSON.parse(d.toString());
    const { to, message } = data;

    if (to in clients) {
      clients[to].write(JSON.stringify({ type: "message", data: { from: sock.id, message } }));
    } else {
      sock.write(JSON.stringify({ type: "error", data: { message: "Message couldn't be delivered" }}));
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
