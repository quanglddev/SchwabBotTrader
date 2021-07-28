import { Builder, WebDriver, By, until, Key } from 'selenium-webdriver';
import { ServiceBuilder } from 'selenium-webdriver/chrome'
import chalk from 'chalk';

import { print } from "@/utils/PrintHelper";

import Watchlist from '@/models/Watchlist';
import { CHROME_DRIVER_PATH, REFRESH_BROWSER_PERIOD } from '@/constants';
import { getClosestWedOrFriInString } from '@/utils/DateHelper';

export default class BrowserController {
    public browsers: Array<WebDriver>;
    public chromeDriverPath: string;
    private serviceBuilder: ServiceBuilder;

    constructor(public watchlist: Watchlist) {
        this.browsers = [];
        this.chromeDriverPath = CHROME_DRIVER_PATH;
        this.serviceBuilder = new ServiceBuilder(this.chromeDriverPath);

        print(chalk.green('SUCCESS: ') + chalk.magenta(`Use browser driver path: ${this.chromeDriverPath}`));
    }

    async prepareBrowserWindowsForTickers(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            for (let i = 0; i < this.watchlist.tickers.length; i++) {
                const driver = await new Builder()
                    .forBrowser('chrome')
                    .setChromeService(this.serviceBuilder)
                    .build();

                this.browsers.push(driver);
            }

            print(chalk.green('SUCCESS: ') + chalk.magenta(`${this.browsers.length} browsers`));
            resolve();
        });
    };

    async prepareTickerOnSchwabBrowser(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const contractInfo = `SPY ${getClosestWedOrFriInString()} 436.00 C`;

            for (let i = 0; i < this.watchlist.tickers.length; i++) {
                const driver = this.browsers[i];
                await driver.get('https://lms.schwab.com/Login?ClientId=schwab-secondary&StartInSetId=1&enableAppD=false&RedirectUri=https://client.schwab.com/Login/Signon/AuthCodeHandler.ashx');
                await driver.wait(until.elementLocated(By.id('LoginId')));
                await driver.wait(until.elementLocated(By.id('Password')));
                await driver.wait(until.elementLocated(By.id('StartIn')));
                await driver.wait(until.elementLocated(By.id('LoginSubmitBtn')));
                await driver.findElement(By.id('LoginId')).sendKeys('quangld');
                await driver.findElement(By.id('Password')).sendKeys('Chase2678445493us');
                await driver.findElement(By.id('StartIn')).sendKeys('OptionStreet');
                await driver.findElement(By.id('LoginSubmitBtn')).click();
                await driver.wait(until.elementLocated(By.id('txtSym')));
                await driver.findElement(By.id('txtSym')).sendKeys(Key.chord(Key.COMMAND, 'a'), contractInfo);

                resolve();
            }
        });
    }

    periodicallyReloadWebsiteToPreventAutoLogout(): void {
        // setInterval(async () => {
        //     for (let i = 0; i < this.browsers.length; i++) {
        //         const driver = this.browsers[i];
        //         driver.navigate().refresh();
        //     }
        // }, REFRESH_BROWSER_PERIOD * 1000 * 60);
    }
}