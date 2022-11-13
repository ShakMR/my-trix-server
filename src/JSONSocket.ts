import crypto from "crypto";
import { Socket, TcpSocketConnectOpts } from "net";
import { ID } from "./types";
import { Duplex } from "stream";

type SocketOptions = {
  privateKey: string; // used for decrypting the received message
  publicKey: string; // used for encrypting the message to be sent
}

class JSONSocket extends Duplex {
  private socketId: ID;
  private _readingPaused: boolean;
  private socket: Socket;

  constructor(socket: Socket = new Socket(), private options: SocketOptions) {
    super({objectMode: true});
    // used to control reading
    this._readingPaused = false;

    // wrap the socket if one was provided
    if (socket) this.wrapSocket(socket);
  }

  private wrapSocket(socket) {
    this.socket = socket;

    // these are simply passed through
    this.socket.on('close', hadError => this.emit('close', hadError));
    this.socket.on('connect', () => this.emit('connect'));
    this.socket.on('drain', () => this.emit('drain'));
    this.socket.on('end', () => this.emit('end'));
    this.socket.on('error', err => this.emit('error', err));
    this.socket.on('lookup', (err, address, family, host) => this.emit('lookup', err, address, family, host)); // prettier-ignore
    this.socket.on('ready', () => this.emit('ready'));
    this.socket.on('timeout', () => this.emit('timeout'));
    // we customize data events!
    this.socket.on('readable', this.onReadable.bind(this));
  }

  private onReadable() {
    while (!this._readingPaused) {

      // read raw len
      let lenBuf = this.socket.read(4);
      if (!lenBuf) return;

      // convert raw len to integer
      let len = lenBuf.readUInt32BE();

      // read read json data
      let body = this.socket.read(len);
      if (!body) {
        this.socket.unshift(lenBuf);
        return;
      }

      // convert raw json to js object
      let json;
      try {
        if (this.options.privateKey) {
          const decryptedMessage = this.decrypt(body);
          json = JSON.parse(decryptedMessage);
        } else if (!this.options.publicKey) {
          json = JSON.parse(body);
        } else {
          throw new Error("Cannot decrypt message because private key wasn't provided");
        }
      } catch (ex) {
        this.socket.destroy(ex);
        return;
      }

      // add object to read buffer
      let pushOk = this.push(json);

      // pause reading if consumer is slow
      if (!pushOk) this._readingPaused = true;
    }
  }

  _read() {
    this._readingPaused = false;
    setImmediate(this.onReadable.bind(this));
  }

  private decrypt(encryptedData: string) {
    return crypto.privateDecrypt(
        {
          key: this.options.privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256",
        },
        // @ts-ignore
        Buffer.from(encryptedData.toString(), "base64")
    ).toString();
  }

  private encrypt(json: string) {
    return crypto.publicEncrypt(
        {
          key: this.options.publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256",
        },
        Buffer.from(json)
    ).toString("base64");
  }

  _write(obj: any, encoding, cb: (error?: Error) => void) {
    let json = JSON.stringify(obj);
    if (this.options.publicKey) {
      json = this.encrypt(json);
    }
    let jsonBytes = Buffer.byteLength(json);
    let buffer = Buffer.alloc(4 + jsonBytes);
    buffer.writeUInt32BE(jsonBytes);
    buffer.write(json, 4);
    this.socket.write(buffer, "base64", cb);
  }

  set id(id: ID) {
    if (!this.socketId) {
      this.socketId = id;
    }
  }

  get id() {
    return this.socketId;
  }

  connect(options: TcpSocketConnectOpts): Promise<void> {
    return new Promise((resolve) => this.socket.connect(options, resolve));
  }
}

export default JSONSocket;
