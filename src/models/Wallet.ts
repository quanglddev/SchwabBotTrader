import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { rootPath } from 'get-root-path';

import { getClosestWedOrFriInString, getDateMMDDYYYYFormatFilenameFriendly } from '@/utils/DateHelper';
import { print } from "@/utils/PrintHelper";

import Ticker from '@/models/Ticker';
import { By, until, WebDriver, Key } from 'selenium-webdriver';
import OptionStrategy, { OptionSentiment } from '@/models/TradeStrategy';
import { findClosestLowerWholeNumber, findClosestUpperWholeNumber } from '@/utils/NumberHelper';
import { AVAILABLE_CASH } from '@/constants';
import CommunicationSocket from './CommunicationSocket';
import BrowserBuyOptionSingleTask from './BrowserTask/BuyOptionSingle';
import StockAPI from './StockAPI';

export default class Wallet {
    public balance: number;
    public availableForTrading: number;

    constructor(
        public stockAPIInstance: StockAPI
    ) {
        this.balance = AVAILABLE_CASH;
        this.availableForTrading = AVAILABLE_CASH;

        print(chalk.green('SUCCESS: ') + chalk.magenta(`Available cash: $${this.availableForTrading}`));
    }

    // async buyToOpen(ticker: Ticker, entryPrice: number, triggerLevelValue: number, targetLevelValue: number, stopLevelValue: number, driver: WebDriver, optionSentiment: OptionSentiment): Promise<void> {
    //     return new Promise(async (resolve, reject) => {
    //         const optionInfo = await this.stockAPIInstance.getAppropriateStrikeAndExpirationDateForOptionSentiment(ticker.symbol, optionSentiment);
    //         const newBuyTask = new BrowserBuyOptionSingleTask(ticker.symbol, optionSentiment, optionInfo.expirationDate, optionInfo.strike, entryPrice, triggerLevelValue, targetLevelValue, stopLevelValue);
    //         this.communicationSocket.sendBrowserTask(newBuyTask);

            // const newTrade = new OptionStrategy(ticker.symbol, optionSentiment, triggerLevelValue, targetLevelValue, stopLevelValue, 1);
            // const lastPrice = _.last(ticker.lastPrices)!;
            // const enterStrike = optionSentiment === 'C' ? findClosestUpperWholeNumber(lastPrice) : findClosestLowerWholeNumber(lastPrice);
            // const contractInfo = `${ticker.symbol.toUpperCase()} ${getClosestWedOrFriInString()} ${enterStrike}.00 ${optionSentiment}`;

            // // Has to be set first to prevent buy again
            // ticker.takenTrades.push(newTrade);

            // print("Attemp to buy")
            // await driver.wait(until.elementLocated(By.id('txtSym')));
            // await driver.findElement(By.id('txtSym')).sendKeys(Key.chord(Key.COMMAND, 'a'), contractInfo);
            // print("Attemp to buy 1")
            // await driver.wait(until.elementLocated(By.id('ddlAction')));
            // await driver.findElement(By.id('ddlAction')).sendKeys('BuyOpen');
            // print("Attemp to buy 2")
            // await driver.wait(until.elementLocated(By.id('txtQty')));
            // await driver.findElement(By.id('txtQty')).sendKeys(Key.chord(Key.COMMAND, 'a'), '1');
            // print("Attemp to buy 3")
            // await driver.wait(until.elementLocated(By.id('ddlType')));
            // await driver.findElement(By.id('ddlType')).sendKeys('Market');
            // print("Attemp to buy 4")
            // await driver.wait(until.elementLocated(By.id('divEstAmtTot')));
            // const estimatedCostText = await driver.findElement(By.id('divEstAmtTot')).getText();
            // print("Attemp to buy 5")
            // // await driver.wait(until.elementLocated(By.id('btnReview')), 5000);
            // // await driver.findElement(By.id('btnReview')).click();
            // // print("Attemp to buy 6")
            // // await driver.wait(until.elementLocated(By.id('btnConfirm')));
            // // await driver.findElement(By.id('btnConfirm')).click();

            // const estimatedCost = parseFloat(estimatedCostText.replace('$', '')) + 0.65; // Contract cost

            // // Don't have enough money :(
            // // if (this.availableForTrading < estimatedCost) {
            // //     return;
            // // }
            // newTrade.enterPrice = estimatedCost;
            // newTrade.enteredStrike = enterStrike;
            // this.balance -= estimatedCost;
            // this.availableForTrading -= estimatedCost;
            // this.logBuyJournal(contractInfo, entryPrice, triggerLevelValue, targetLevelValue, stopLevelValue, estimatedCost);
            // resolve();
    //     });
    // }

    // async sellToClose(tradeStrategy: OptionStrategy, sellPrice: number, driver: WebDriver): Promise<void> {
    //     return new Promise(async (resolve, reject) => {
    //         const contractInfo = `${tradeStrategy.ticker.toUpperCase()} ${getClosestWedOrFriInString()} ${Math.round(tradeStrategy.enteredStrike)}.00 ${tradeStrategy.sentiment}`;

    //         await driver.wait(until.elementLocated(By.id('txtSym')));
    //         await driver.findElement(By.id('txtSym')).sendKeys(Key.chord(Key.COMMAND, 'a'), contractInfo);
    //         await driver.wait(until.elementLocated(By.id('ddlAction')));
    //         await driver.findElement(By.id('ddlAction')).sendKeys('SellClose');
    //         await driver.wait(until.elementLocated(By.id('txtQty')));
    //         await driver.findElement(By.id('txtQty')).sendKeys(Key.chord(Key.COMMAND, 'a'), '1');
    //         await driver.wait(until.elementLocated(By.id('ddlType')));
    //         await driver.findElement(By.id('ddlType')).sendKeys('Market');
    //         await driver.wait(until.elementLocated(By.id('divEstAmtTot')));
    //         const estimatedReturnText = await driver.findElement(By.id('divEstAmtTot')).getText();
    //         // await driver.wait(until.elementLocated(By.id('btnReview')));
    //         // await driver.findElement(By.id('btnReview')).click();
    //         // await driver.wait(until.elementLocated(By.id('btnConfirm')));

    //         const estimatedReturn = parseFloat(estimatedReturnText.replace('$', '')) - 0.65; // Contract cost

    //         tradeStrategy.exitPrice = estimatedReturn;

    //         this.balance += estimatedReturn;
    //         this.logSellJournal(contractInfo, sellPrice, estimatedReturn);
    //         resolve();
    //     });
    // }

    // logBuyJournal(prefix: string, entryPrice: number, triggerLevelValue: number, targetLevelValue: number, stopLevelValue: number, estimatedCost: number): void {
    //     const journalName = `${getDateMMDDYYYYFormatFilenameFriendly()}.txt`;
    //     const journalPath = path.join(rootPath, 'logs', journalName);
    //     const currentTime = new Date();
    //     const timeString = `${currentTime.toLocaleDateString()} ${currentTime.toLocaleTimeString()}`;

    //     const content = `${timeString}: BUY 1 ${prefix} @$${estimatedCost} (ENTRY: ${entryPrice.toFixed(2)}. TRIGGER: ${triggerLevelValue.toFixed(2)}. TP: ${targetLevelValue.toFixed(2)}. SL: ${stopLevelValue.toFixed(2)}.`;
    //     print(chalk.magenta(content));
    //     fs.writeFile(journalPath, content + '\n', { flag: 'a+' }, err => {
    //         if (err) {
    //             console.error(`Error writing on journal: ${journalName} (${err})`);
    //         }
    //     });
    // }

    // logSellJournal(prefix: string, sellPrice: number, estimatedReturn: number): void {
    //     const journalName = `${getDateMMDDYYYYFormatFilenameFriendly()}.txt`;
    //     const journalPath = path.join(rootPath, 'logs', journalName);
    //     const currentTime = new Date();
    //     const timeString = `${currentTime.toLocaleDateString()} ${currentTime.toLocaleTimeString()}`;

    //     const content = `${timeString}: SELL 1 ${prefix} @$${estimatedReturn.toFixed(2)} (TRIGGER: ${sellPrice.toFixed(2)})`;
    //     print(chalk.magenta(content));
    //     fs.writeFile(journalPath, content + '\n', { flag: 'a+' }, err => {
    //         if (err) {
    //             console.error(`Error writing on journal: ${journalName} (${err})`);
    //         }
    //     });
    // }
}