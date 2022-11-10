import { Socket } from "net";

export type ID = number

export type SocketWithId = Socket & { id?: ID };
export type ResponseData = {
    type: "message"
    data: {
        from: ID,
        message: string
    }
}
export type Data = {
    type: "message"
    data: {
        to: ID,
        message: string
    }
}
