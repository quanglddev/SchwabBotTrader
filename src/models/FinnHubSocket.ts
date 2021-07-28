import { client, connection, IMessage } from 'websocket';
import { TypedJSON } from 'typedjson';
import chalk from 'chalk';

import { print } from "@/utils/PrintHelper";

import PriceUpdateStream from '@/models/FinnHub/PriceUpdateStream';
import { isWeekend } from '@/utils/DateHelper';
import Watchlist from '@/models/Watchlist';
import Brain from '@/models/Brain';
import { FINNHUB_TOKEN } from '@/constants';

export default class FinnHubSocket {
    private token: string;
    public clientWS: client;
    public connection: connection | undefined;
    public serializer: TypedJSON<PriceUpdateStream>;

    constructor(public brain: Brain) {
        this.token = FINNHUB_TOKEN;
        this.clientWS = new client();
        this.serializer = new TypedJSON(PriceUpdateStream);

        this.clientWS.on('connectFailed', (error) => {
            this.onWSConnectionFailed(error);
        });

        this.clientWS.on('connect', (connection) => {
            this.onWSConnected(connection);
        });

        print(chalk.green('SUCCESS'));
    }

    onWSConnectionFailed(error: Error): void {
        print('Connect Error: ' + error.toString());
    }

    onWSFailed(error: Error): void {
        print("Connection Error: " + error.toString());
    }

    onWSConnected(connection: connection): void {
        print(chalk.green('SUCCESS: ') + chalk.magenta('Connected!'));
        connection.on('error', (error) => {
            this.onWSFailed(error);
        });
        connection.on('close', () => {
            this.onWSConnectionClose();
        });
        connection.on('message', (message) => {
            this.onWSNewMessage(message);
        });

        this.connection = connection;
    }

    onWSConnectionClose(): void {
        print('echo-protocol Connection Closed');
    }

    onWSNewMessage(message: IMessage): void {
        if (message.type === 'utf8') {
            const obj = this.serializer.parse(message.utf8Data ?? '');
            if (obj) {
                this.brain.updateTickersCurrentPriceBasedOnStreamData(obj);
            }
        }
    }

    establishConnection(): void {
        if (isWeekend()) {
            print(chalk.red('ERROR: ') + chalk.magenta('It\'s weekend! Take a break dude! Try again tomorrow!'));
            return;
        }
        this.clientWS.connect(`wss://ws.finnhub.io?token=${this.token}`);
    }

    setupListenersForWachlist(watchlist: Watchlist): void {
        if (this.connection && this.connection.connected) {
            watchlist.tickers.forEach((ticker) => {
                this.connection!.sendUTF(JSON.stringify({ 'type': 'subscribe', 'symbol': ticker.symbol.toUpperCase() }))
            });
        }

        print(chalk.green('SUCCESS'));
    }
}