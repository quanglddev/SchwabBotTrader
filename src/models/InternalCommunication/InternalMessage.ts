import BrowserTask from "../BrowserTask/BrowserTask";
import { ConnectionPurpose } from "./InternalConnection";

export enum InternalMessageType {
    Register = 'REGISTER',
    ReturnValueFromTask = 'RETURN_VALUE_FROM_TASK'
}

export abstract class InternalMessage {
    constructor(
        public messageType: InternalMessageType,
    ) { }
}

export class InternalRegisterMessage extends InternalMessage {
    constructor(
        public connectionPurpose: ConnectionPurpose
    ) {
        super(InternalMessageType.Register);
    }
}

export class InternalReturnMessage extends InternalMessage {
    constructor(
        public value: string
    ) {
        super(InternalMessageType.ReturnValueFromTask);
    }
}