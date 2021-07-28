import 'module-alias/register';
import chalk from 'chalk';
import { REFRESH_BROWSER_PERIOD } from '@/constants';
import Browser from '@/models/Browser';
import BrowserLoginTask from '@/models/BrowserTask/LoginTask';

import { print } from '@/utils/PrintHelper';
import BrowserRefreshTask from '@/models/BrowserTask/RefreshTask';
import BrowserSocket from './models/BrowserSocket';
import Wallet from './models/Wallet';
import StockAPI from './models/StockAPI';

const main = async () => {
    const stockAPIInstance = new StockAPI();
    print(chalk.inverse('1. Initializing wallet instance...'));
    const wallet = new Wallet(stockAPIInstance);

    print(chalk.inverse('1. Initializing browser instance...'));
    const browser = new Browser();
    await browser.prepareBrowser();
    const loginTask = new BrowserLoginTask()
    browser.runTasksInQueue();
    browser.addTask(loginTask);

    // setInterval(() => {
    //     const refreshTask = new BrowserRefreshTask();
    //     browser.addTask(refreshTask);
    // }, REFRESH_BROWSER_PERIOD * 60 * 1000);

    // const browserSocketInstance = new BrowserSocket(browser, wallet);
    // print(chalk.inverse('2. Establishing FinnHub websocket connection...'));

    // // The server might not be up yet here, so a work-around is the 3 seconds delay
    // setTimeout(async () => {
    //     browserSocketInstance.establishConnection();
    //     setTimeout(() => {
    //         browserSocketInstance.sendRegisterMessage();
    //     }, 1500);
    // }, 1500);
};

main();