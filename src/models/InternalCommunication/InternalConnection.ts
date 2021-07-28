import { connection } from 'websocket';

export enum ConnectionPurpose {
    Simulation = 'SIMULATION',
    WebActivity = 'WEB_ACTIVITY'
};

export default class InternalConnection {
    constructor(
        public connectionPurpose: ConnectionPurpose,
        public connection: connection
    ) {

    }
};