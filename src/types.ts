import { Socket } from "net";

export type ID = number

export type SocketWithId = Socket & { id?: ID };
export type ResponseMessage = {
    type: "message",
    data: {
        from: ID,
        message: string
    }
}
export type TextMessage = {
    type: "message",
    data: {
        to: ID,
        message: string
    }
}

export type HashCheck = {
    type: "hash",
    data: {
        hash: string,
    },
}

export type InitMessage = {
    type: "init",
    data: {
        id: number;
    }
}

    export type AuthConfig = {
    type: "password",
    user: string,
    password: string,
} | {
    type: "token",
    token: string
}

export type AuthMessage = {
    type: "auth",
    data: AuthConfig,
}

export type AuthResponseMessage = {
    type: "auth_response",
    data: {
        sessionToken: string,
    },
}

export type AnyMessage = TextMessage | AuthMessage
export type AnyResponseMessage = ResponseMessage | InitMessage | AuthResponseMessage
