import {
  AnyMessage,
  AnyResponseMessage,
  AuthConfig,
  AuthResponseMessage,
  InitMessage,
  ResponseMessage,
  TextMessage,
} from "./types";
import JSONSocket from "./JSONSocket";

type ClientConfig = {
  host?: string;
  port: number;
  auth?: AuthConfig;
};

class Client {
  private readonly host: string;
  private readonly port: number;
  private readonly auth: AuthConfig;
  private socket: JSONSocket;
  private id: number;
  private sessionToken: string;
  private subscribers: ((c: any) => void)[];
  private queue: any[];

  constructor({ host, port, auth }: ClientConfig) {
    this.host = host;
    this.port = port;
    this.auth = auth;
    this.socket = new JSONSocket();
    this.subscribers = [];
    this.queue = [];
  }

  connect() {
    return this.socket
      .connect({
        port: this.port,
        host: this.host,
      })
      .then(() => {
        this.socket.on("data", this.receiveFromServer.bind(this));
        if (this.auth) {
          this.socket.write({ type: "auth", data: this.auth });
        }
      });
  }

  private receiveFromServer({ type, data }: AnyResponseMessage) {
    switch (type) {
      case "init":
        return this.handleInit(data);
      case "auth_response":
        return this.handleAuthResp(data);
      case "message":
        return this.handleMessage(data);
      default:
        throw new Error("Received unknown message from server");
    }
  }

  private handleInit({ id }: InitMessage["data"]) {
    this.id = id;
    this.handleMessage({
      from: 0,
      message: `You have been assigned with id ${id}`,
    });
  }

  private handleAuthResp({ sessionToken }: AuthResponseMessage["data"]) {
    this.sessionToken = sessionToken;
  }

  private handleMessage(data: ResponseMessage["data"]) {
    this.subscribers.forEach((cb) => cb(data));
    this.queue.push(data);
  }

  public send(data: AnyMessage) {
    const authenticatedMessage = {
      ...data,
      token: this.sessionToken,
    };
    this.socket.write(data);
  }

  public getMessage() {
    return this.queue.shift();
  }

  public subscribe(cb: (c: any) => void): number {
    return this.subscribers.push(cb) - 1;
  }

  public unsubscribe(index: number): void {
    this.subscribers.splice(index, 1);
  }
}

export default Client;
