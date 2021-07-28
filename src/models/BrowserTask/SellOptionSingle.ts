import { getDateMMDDYYYYFormat, getDateMMDDYYYYFormatFilenameFriendly } from "@/utils/DateHelper";
import { print } from "@/utils/PrintHelper";
import fs from 'fs';
import chalk from "chalk";
import rootPath from "get-root-path";
import path from "path";
import { By, Key, until, WebDriver } from "selenium-webdriver";
import { OptionSentiment } from "../TradeStrategy";
import BrowserTask, { BrowserTaskType } from "./BrowserTask";
import { Driver } from "selenium-webdriver/chrome";
import Wallet from "../Wallet";

export default class BrowserSellOptionSingleTask extends BrowserTask {
    constructor(
        public tickerSymbol: string,
        public optionSentiment: OptionSentiment,
        public expirationDate: Date,
        public strike: number,
        public sellPrice: number,
        public wallet: Wallet | undefined = undefined
    ) {
        super(BrowserTaskType.SellOptionSingle);
    }

    async start(driver: Driver): Promise<number> {
        return new Promise(async (resolve, reject) => {
            const contractInfo = `${this.tickerSymbol.toUpperCase()} ${getDateMMDDYYYYFormat(this.expirationDate)} ${this.strike.toFixed(2)} ${this.optionSentiment}`;

            await driver.wait(until.elementLocated(By.id('txtSym')));
            await driver.findElement(By.id('txtSym')).sendKeys(Key.chord(Key.COMMAND, 'a'), contractInfo);
            await driver.wait(until.elementLocated(By.id('ddlAction')));
            await driver.findElement(By.id('ddlAction')).sendKeys('SellClose');
            await driver.wait(until.elementLocated(By.id('txtQty')));
            await driver.findElement(By.id('txtQty')).sendKeys(Key.chord(Key.COMMAND, 'a'), '1');
            await driver.wait(until.elementLocated(By.id('ddlType')));
            await driver.findElement(By.id('ddlType')).sendKeys('Market');
            await driver.wait(until.elementLocated(By.id('divEstAmtTot')));
            const estimatedReturnText = await driver.findElement(By.id('divEstAmtTot')).getText();
            // await driver.wait(until.elementLocated(By.id('btnReview')));
            // await driver.findElement(By.id('btnReview')).click();
            // await driver.wait(until.elementLocated(By.id('btnConfirm')));

            const estimatedReturn = parseFloat(estimatedReturnText.replace('$', '')) - 0.65; // Contract cost

            this.logSellJournal(contractInfo, estimatedReturn);
            resolve(estimatedReturn)
        });
    }

    logSellJournal(prefix: string, estimatedReturn: number): void {
        const journalName = `${getDateMMDDYYYYFormatFilenameFriendly()}.txt`;
        const journalPath = path.join(rootPath, 'logs', journalName);
        const currentTime = new Date();
        const timeString = `${currentTime.toLocaleDateString()} ${currentTime.toLocaleTimeString()}`;

        const content = `${timeString}: SELL 1 ${prefix} @$${estimatedReturn.toFixed(2)} (TRIGGER: ${this.sellPrice.toFixed(2)})`;
        print(chalk.magenta(content));
        fs.writeFile(journalPath, content + '\n', { flag: 'a+' }, err => {
            if (err) {
                console.error(`Error writing on journal: ${journalName} (${err})`);
            }
        });
    }
}