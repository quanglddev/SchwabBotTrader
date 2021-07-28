import chalk from 'chalk';
import _ from 'lodash';

import { print } from "@/utils/PrintHelper";

import Ticker, { StockDirection } from "@/models/Ticker";
import { isLottoFriday, isWeekend } from "@/utils/DateHelper";
import StockAPI from "@/models/StockAPI";
import { getTickersFromTextFileHelper } from '@/utils/FileReader';
import { DEFAULT_RESOLUTION, DEFAULT_TICKER, WATCHLIST_PATH } from '@/constants';

export default class Watchlist {
    public tickers: Array<Ticker>;
    public watchlistPath: string;
    public defaultTicker: string;
    private defaultResolution: string;
    private finnhubAPIInstance: StockAPI;

    constructor(finnhubAPIInstance: StockAPI) {
        this.tickers = [];
        this.watchlistPath = WATCHLIST_PATH;
        this.defaultTicker = DEFAULT_TICKER;
        this.defaultResolution = DEFAULT_RESOLUTION;
        this.finnhubAPIInstance = finnhubAPIInstance;

        print(chalk.green('SUCCESS: ') + chalk.magenta(`Use watchlist path: ${this.watchlistPath}`));
    }

    async loadTickersBasedOnDay(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const weekend = isWeekend();
            const friday = isLottoFriday();

            let newTickers: Array<Ticker> = [];
            if (weekend) {
                newTickers = [];
            }
            if (friday) {
                newTickers = await this.extractTickersFromTextFile(this.watchlistPath);
            }
            else {
                const levels = await this.finnhubAPIInstance.getSupportResistance(this.defaultTicker, this.defaultResolution);
                const newTicker = new Ticker(this.defaultTicker, StockDirection.Sideway, levels, []);
                newTickers = [newTicker];
            }

            this.tickers = newTickers;
            print(chalk.green('SUCCESS: ') + chalk.magenta(`${newTickers.length} ticker(s) \n${newTickers.map((ticker) => `${ticker.symbol} - [${ticker.levels.map((level) => Math.round(level.value * 100) / 100).join('|')}]`).join('\n')}`));
            resolve();
        });
    }

    async extractTickersFromTextFile(textFilePath: string): Promise<Array<Ticker>> {
        return new Promise(async (resolve, reject) => {
            const tickers = await getTickersFromTextFileHelper(textFilePath);
            resolve(tickers);
        });
    }
}