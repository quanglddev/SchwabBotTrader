import { By, until, WebDriver } from "selenium-webdriver";
import { Driver } from "selenium-webdriver/chrome";
import BrowserTask, { BrowserTaskType } from "./BrowserTask";

export default class BrowserRefreshTask extends BrowserTask {
    constructor(
    ) {
        super(BrowserTaskType.Refresh);
    }

    async start(driver: Driver): Promise<number> {
        return new Promise(async (resolve, reject) => {
            await driver.navigate().refresh();
            resolve(0);
        });
    }
}