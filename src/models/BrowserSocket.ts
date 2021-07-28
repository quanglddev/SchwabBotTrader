import { client, connection, IMessage } from 'websocket';
import chalk from 'chalk';

import { print } from "@/utils/PrintHelper";

import { COMMUNICATION_PORT } from '@/constants';
import { InternalRegisterMessage } from './InternalCommunication/InternalMessage';
import { ConnectionPurpose } from './InternalCommunication/InternalConnection';
import BrowserTask, { BrowserTaskType } from './BrowserTask/BrowserTask';
import Browser from './Browser';
import BrowserLoginTask from './BrowserTask/LoginTask';
import BrowserRefreshTask from './BrowserTask/RefreshTask';
import BrowserBuyOptionSingleTask from './BrowserTask/BuyOptionSingle';
import BrowserSellOptionSingleTask from './BrowserTask/SellOptionSingle';
import Wallet from './Wallet';

export default class BrowserSocket {
    public clientWS: client;
    public connection: connection | undefined;

    constructor(
        public browser: Browser,
        public wallet: Wallet
    ) {
        this.clientWS = new client();

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
            let newGeneralTask = JSON.parse(message.utf8Data!);
            console.log(newGeneralTask)
            switch (newGeneralTask.taskType) {
                case BrowserTaskType.Login:
                    let newLoginTask = new BrowserLoginTask();
                    this.browser.addTask(newLoginTask);
                    break;
                case BrowserTaskType.Refresh:
                    const newRefreshTask = new BrowserRefreshTask();
                    this.browser.addTask(newRefreshTask);
                    break;
                case BrowserTaskType.BuyOptionSingle:
                    const newBuySingleTask = new BrowserBuyOptionSingleTask(
                        newGeneralTask.tickerSymbol,
                        newGeneralTask.optionSentiment,
                        newGeneralTask.expirationDate,
                        newGeneralTask.strike,
                        newGeneralTask.entryPrice,
                        newGeneralTask.triggerLevelValue,
                        newGeneralTask.targetLevelValue,
                        newGeneralTask.stopLevelValue,
                        this.wallet
                    );
                    this.browser.addTask(newBuySingleTask);
                    break;
                case BrowserTaskType.SellOptionSingle:
                    const newSellSingleTask = new BrowserSellOptionSingleTask(
                        newGeneralTask.tickerSymbol,
                        newGeneralTask.optionSentiment,
                        newGeneralTask.expirationDate,
                        newGeneralTask.strike,
                        newGeneralTask.sellPrice,
                        this.wallet
                    )
                    this.browser.addTask(newSellSingleTask);
                    break;
                default:
                    console.error('Needs immediate attention')
                    break;
            }
        }
    }

    establishConnection(): void {
        this.clientWS.connect(`ws://localhost:${COMMUNICATION_PORT}/`, 'echo-protocol');
    }

    sendRegisterMessage(): void {
        if (this.connection && this.connection.connected) {
            const internalRegisterMessage = new InternalRegisterMessage(ConnectionPurpose.WebActivity);
            this.connection.sendUTF(JSON.stringify(internalRegisterMessage));
        }
    }
}