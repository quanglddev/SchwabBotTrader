import { server, IMessage, request } from 'websocket';
import http from 'http';

import { print } from "@/utils/PrintHelper";
import chalk from 'chalk';
import InternalConnection, { ConnectionPurpose } from './InternalCommunication/InternalConnection';
import { InternalMessage, InternalMessageType, InternalRegisterMessage, InternalReturnMessage } from './InternalCommunication/InternalMessage';
import { COMMUNICATION_PORT } from '@/constants';
import BrowserTask from './BrowserTask/BrowserTask';
import BrowserLoginTask from './BrowserTask/LoginTask';



export default class CommunicationSocket {
    public serverWS: server;
    public connections: Array<InternalConnection> = [];

    constructor() {
        const httpServer = http.createServer((req, res) => {
            console.log((new Date()) + ' Received request for ' + req.url);
            res.writeHead(404);
            res.end();
        });

        httpServer.listen(COMMUNICATION_PORT, () => {
            console.log((new Date()) + ` Server is listening on port ${COMMUNICATION_PORT}`);
        });
        // this.serializer = new TypedJSON(PriceUpdateStream);

        this.serverWS = new server({
            httpServer: httpServer,
            autoAcceptConnections: false
        });

        this.serverWS.on('request', (req) => {
            this.onWSNewRequest(req);
        });

        print(chalk.green('SUCCESS'));
    }

    originIsAllowed(origin: string): boolean {
        return true;
    }

    onWSNewRequest(req: request): void {
        if (!this.originIsAllowed(req.origin)) {
            // Make sure we only accept requests from an allowed origin
            req.reject();
            console.log((new Date()) + ' Connection from origin ' + req.origin + ' rejected.');
            return;
        }

        const connection = req.accept('echo-protocol', req.origin);
        console.log((new Date()) + ' Connection accepted.');
        connection.on('message', (message) => {
            const messageObj = JSON.parse(message.utf8Data!) as InternalMessage;
            switch (messageObj.messageType) {
                case InternalMessageType.Register:
                    const actualRegisterMessage = messageObj as InternalRegisterMessage;
                    const newConnection = new InternalConnection(actualRegisterMessage.connectionPurpose, connection);
                    this.connections.push(newConnection);

                    // this.sendBrowserTask(new BrowserLoginTask())
                    break;
                default:
                    this.onWSNewMessage(message);
                    break;
            }
        });

        connection.on('close', (reasonCode, description) => {
            this.onWSError(reasonCode, description);
        });
    }

    onWSNewMessage(message: IMessage): void {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            // this.connection!.sendUTF(message.utf8Data);
        }
    }

    onWSError(reasonCode: number, description: string) {
        console.log((new Date()) + ' Peer disconnected.');
    }

    sendBrowserTask(browserTask: BrowserTask): void {
        const webConnection = this.connections.find((connection) => connection.connectionPurpose === ConnectionPurpose.WebActivity);

        if (!webConnection) {
            console.error('No connection to web driver found');
            return;
        }

        if (webConnection.connection && webConnection.connection.connected) {
            webConnection.connection.sendUTF(JSON.stringify(browserTask));
        }
    }
}