import { WebDriver } from "selenium-webdriver";

export enum BrowserTaskType {
    Refresh = 'REFRESH',
    Login = 'LOGIN',
    BuyOptionSingle = 'BUY_OPTION_SINGLE',
    SellOptionSingle = 'SELL_OPTION_SINGLE'
};

export default abstract class BrowserTask {
    public isInProgress: boolean = false;
    public isDone: boolean = false;
    public isCancelled: boolean = false;

    constructor(
        public taskType: BrowserTaskType
    ) { }

    abstract start(driver: WebDriver): Promise<number>;
};