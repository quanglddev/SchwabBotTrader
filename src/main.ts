import 'module-alias/register';
import chalk from 'chalk';

import StockAPI from "@/models/StockAPI";

import Watchlist from '@/models/Watchlist';
import Brain from '@/models/Brain';
import { print } from './utils/PrintHelper';
import FinnHubSocket from './models/FinnHubSocket';
import CommunicationSocket from './models/CommunicationSocket';
// import CommunicationSocket from './models/CommunicationSocket';

const main = async () => {
    // print(chalk.inverse('1. Initializing wallet instance...'));
    // const wallet = new Wallet();

    print(chalk.inverse('2. Initializing FinnHub instance...'));
    const stockAPIInstance = new StockAPI();

    print(chalk.inverse('3. Initializing watchlist instance...'));
    const watchlist = new Watchlist(stockAPIInstance);

    print(chalk.inverse('4. Loading tickers for watchlist with initial levels...'));
    await watchlist.loadTickersBasedOnDay();

    // print(chalk.inverse('5. Initializing browser controller instance...'));
    // const browserController = new BrowserController(watchlist);

    // print(chalk.inverse('6. Setting up web driver for each ticker...'));
    // await browserController.prepareBrowserWindowsForTickers();

    // await browserController.prepareTickerOnSchwabBrowser();
    // await browserController.periodicallyReloadWebsiteToPreventAutoLogout();

    const communicationSocket = new CommunicationSocket();

    // print(chalk.inverse('1. Initializing wallet instance...'));
    // const wallet = new Wallet(communicationSocket, stockAPIInstance);

    print(chalk.inverse('9. Initializing brain instance...'));
    const brain = new Brain(watchlist, stockAPIInstance, communicationSocket);
    brain.periodicallyUpdateQuotes();
    // brain.periodicallyCheckSetupsAndBuyIfCriteriasMet();
    brain.periodicallyUpdateLevelsForAllTickers();
    // brain.periodicallyCheckIfShouldSell();

    const finnhubSocketInstance = new FinnHubSocket(brain);
    print(chalk.inverse('7. Establishing FinnHub websocket connection...'));
    finnhubSocketInstance.establishConnection();

    // The connection might NOT be fully established here, so a work-around is the 3 seconds delay
    setTimeout(async () => {
        if (!finnhubSocketInstance.connection || !finnhubSocketInstance.connection.connected) {
            finnhubSocketInstance.clientWS.abort();
            return;
        }

        print(chalk.inverse('8. Establishing stock quotes listeners for watchlist...'));
        finnhubSocketInstance.setupListenersForWachlist(watchlist);
    }, 3000);
};

main();
