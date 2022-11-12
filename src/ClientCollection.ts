import { ID } from "./types";
import JSONSocket from "./JSONSocket";

class JSONClientCollection {
    constructor(private clients: Map<ID, JSONSocket>) {}

    addClient(client: JSONSocket) {
        if (this.clients.has(client.id)) {
            return {
                type: "error",
                message: "A client with that ID already exists",
                errorCode: "ERR-CLIENT-001",
            }
        }

        this.clients.set(client.id, client);
    }

    listClientIds(): ID[] {
        return Array.from(this.clients.keys());
    }

    getClient(id: ID) {
        return this.clients.get(id);
    }
}
