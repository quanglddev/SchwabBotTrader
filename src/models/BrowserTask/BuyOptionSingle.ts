import { getDateMMDDYYYYFormat, getDateMMDDYYYYFormatFilenameFriendly } from "@/utils/DateHelper";
import { print } from "@/utils/PrintHelper";
import fs from 'fs';
import chalk from "chalk";
import rootPath from "get-root-path";
import path from "path";
import { By, Key, until, WebDriver } from "selenium-webdriver";
import { OptionSentiment } from "../TradeStrategy";
import BrowserTask, { BrowserTaskType } from "./BrowserTask";
import Wallet from "../Wallet";

export default class BrowserBuyOptionSingleTask extends BrowserTask {
    constructor(
        public tickerSymbol: string,
        public optionSentiment: OptionSentiment,
        public expirationDate: Date,
        public strike: number,
        public entryPrice: number,
        public triggerLevelValue: number,
        public targetLevelValue: number,
        public stopLevelValue: number,
        public wallet: Wallet | undefined = undefined
    ) {
        super(BrowserTaskType.BuyOptionSingle);
    }

    async start(driver: WebDriver): Promise<number> {
        return new Promise(async (resolve, reject) => {
            const contractInfo = `${this.tickerSymbol.toUpperCase()} ${getDateMMDDYYYYFormat(this.expirationDate)} ${this.strike.toFixed(2)} ${this.optionSentiment}`;
        
            await driver.wait(until.elementLocated(By.id('txtSym')));
            await driver.findElement(By.id('txtSym')).sendKeys(Key.chord(Key.COMMAND, 'a'), contractInfo);
            await driver.wait(until.elementLocated(By.id('ddlAction')));
            await driver.findElement(By.id('ddlAction')).sendKeys('BuyOpen');
            await driver.wait(until.elementLocated(By.id('txtQty')));
            await driver.findElement(By.id('txtQty')).sendKeys(Key.chord(Key.COMMAND, 'a'), '1');
            await driver.wait(until.elementLocated(By.id('ddlType')));
            await driver.findElement(By.id('ddlType')).sendKeys('Market');
            await driver.wait(until.elementLocated(By.id('divEstAmtTot')));
            const estimatedCostText = await driver.findElement(By.id('divEstAmtTot')).getText();
            // await driver.wait(until.elementLocated(By.id('btnReview')), 5000);
            // await driver.findElement(By.id('btnReview')).click();
            // await driver.wait(until.elementLocated(By.id('btnConfirm')));
            // await driver.findElement(By.id('btnConfirm')).click();

            const estimatedCost = parseFloat(estimatedCostText.replace('$', '')) + 0.65; // Contract cost
            this.logBuyJournal(contractInfo, estimatedCost);
            resolve(estimatedCost);
        });
    }

    logBuyJournal(prefix: string, estimatedCost: number): void {
        const journalName = `${getDateMMDDYYYYFormatFilenameFriendly()}.txt`;
        const journalPath = path.join(rootPath, 'logs', journalName);
        const currentTime = new Date();
        const timeString = `${currentTime.toLocaleDateString()} ${currentTime.toLocaleTimeString()}`;

        const content = `${timeString}: BUY 1 ${prefix} @$${estimatedCost} (ENTRY: ${this.entryPrice.toFixed(2)}. TRIGGER: ${this.triggerLevelValue.toFixed(2)}. TP: ${this.targetLevelValue.toFixed(2)}. SL: ${this.stopLevelValue.toFixed(2)}.`;
        print(chalk.magenta(content));
        fs.writeFile(journalPath, content + '\n', { flag: 'a+' }, err => {
            if (err) {
                console.error(`Error writing on journal: ${journalName} (${err})`);
            }
        });
    }
}