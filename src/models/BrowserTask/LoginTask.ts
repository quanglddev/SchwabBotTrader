import { SCHWAB_LOGIN_URL, SCHWAB_PASSWORD, SCHWAB_USERNAME } from "@/constants";
import { By, until, WebDriver } from "selenium-webdriver";
import BrowserTask, { BrowserTaskType } from "./BrowserTask";

export default class BrowserLoginTask extends BrowserTask {

    constructor(
    ) {
        super(BrowserTaskType.Login);
    }

    async start(driver: WebDriver): Promise<number> {
        return new Promise(async (resolve, reject) => {
            await driver.get(SCHWAB_LOGIN_URL);
            await driver.wait(until.elementLocated(By.id('LoginId')));
            await driver.wait(until.elementLocated(By.id('Password')));
            await driver.wait(until.elementLocated(By.id('StartIn')));
            await driver.wait(until.elementLocated(By.id('LoginSubmitBtn')));
            await driver.findElement(By.id('LoginId')).sendKeys(SCHWAB_USERNAME);
            await driver.findElement(By.id('Password')).sendKeys(SCHWAB_PASSWORD);
            await driver.findElement(By.id('StartIn')).sendKeys('OptionStreet');
            await driver.findElement(By.id('LoginSubmitBtn')).click();
            await driver.wait(until.elementLocated(By.id('txtSym')));

            resolve(0);
        });
    }
}