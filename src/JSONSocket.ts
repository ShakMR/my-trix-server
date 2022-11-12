import { Socket, TcpSocketConnectOpts } from "net";
import { AnyMessage, ID } from "./types";
import { Duplex } from "stream";

class JSONSocket extends Duplex {
  private socketId: ID;
  private _readingPaused: boolean;
  private socket: Socket;

  constructor(socket: Socket = new Socket()) {
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
        json = JSON.parse(body);
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

  _write(obj: any, encoding, cb: (error?: Error) => void) {
    let json = JSON.stringify(obj);
    let jsonBytes = Buffer.byteLength(json);
    let buffer = Buffer.alloc(4 + jsonBytes);
    buffer.writeUInt32BE(jsonBytes);
    buffer.write(json, 4);
    this.socket.write(buffer, encoding, cb);
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
