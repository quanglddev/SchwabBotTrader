import regression from 'regression';

import { print } from "@/utils/PrintHelper";

import { DEFAULT_RESOLUTION, MINUTES_DETERMINE_DIRECTION, SECONDS_UPDATE_QUOTES, SIDEWAY_GRADIENT_MARGIN } from "@/constants";

import OptionStrategy from "@/models/TradeStrategy";
import Level from "@/models/Level";
import StockAPI from './StockAPI';
import chalk from 'chalk';

export enum StockDirection {
    Up = 'UP',
    Down = 'DOWN',
    Sideway = 'SIDEWAY'
}

export default class Ticker {
    public lastPrices: Array<number> = []; // To determine isGoingUp
    public lastVolumes: Array<number> = [];
    public lastEMAs: Array<number> = [];
    public currentPrice: number = 0;

    constructor(
        public symbol: string,
        public direction: StockDirection,
        public levels: Array<Level>,
        public takenTrades: Array<OptionStrategy>,
    ) { }

    updateDirection(): number {
        const numberOfPricesToDetermineDirection = MINUTES_DETERMINE_DIRECTION / (SECONDS_UPDATE_QUOTES / 60);

        if (this.lastPrices.length < numberOfPricesToDetermineDirection) {
            this.direction = StockDirection.Sideway;
            return 0;
        }

        // Make sure the size of prices always within NO_PRICES_TO_DETERMINE_DIRECTION elements range
        const pricesThatWillBeTakenIntoAccount = this.lastPrices.slice(Math.max(this.lastPrices.length - numberOfPricesToDetermineDirection, 0));
        this.lastPrices = pricesThatWillBeTakenIntoAccount;

        const prepareForRegression: regression.DataPoint[] = pricesThatWillBeTakenIntoAccount.map((price, idx) => [price, idx]);
        const result = regression.linear(prepareForRegression);
        const gradient = result.equation[0];

        print(chalk.gray(`DIRECTION UPDATED WITH AMOUNT OF LAST PRICES: ${pricesThatWillBeTakenIntoAccount.length}`));

        if (gradient <= SIDEWAY_GRADIENT_MARGIN && gradient >= -SIDEWAY_GRADIENT_MARGIN) {
            this.direction = StockDirection.Sideway;
            return gradient;
        }
        else if (gradient > SIDEWAY_GRADIENT_MARGIN) {
            this.direction = StockDirection.Up;
            return gradient;
        }
        else {
            this.direction = StockDirection.Down;
            return gradient;
        }
    }

    async updateLevels(finnhubAPIInstance: StockAPI): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const levels = await finnhubAPIInstance.getSupportResistance(this.symbol, DEFAULT_RESOLUTION);
            print(chalk.gray(`UPDATE NEW LEVELS: ${this.symbol} - [${levels.map((level) => Math.round(level.value * 100) / 100).join('|')}]`))
            this.levels = levels;
            resolve();
        });
    }

    updateTPForTakenTrades = (): void => {
        for (let i = 0; i < this.takenTrades.length; i++) {
            const takenTrade = this.takenTrades[i];
            const TP = takenTrade.profitTarget;

            // https://www.gavsblog.com/blog/find-closest-number-in-array-javascript
            const cloestNewTP = this.levels.map((level) => level.value).reduce((a, b) => {
                return Math.abs(b - TP) < Math.abs(a - TP) ? b : a;
            });

            if (cloestNewTP !== TP) {
                print(chalk.gray(`UPDATED TP FOR ${this.symbol}: $${TP} -> $${cloestNewTP}`));
            }

            takenTrade.profitTarget = cloestNewTP;
        }
    };

    async getIndicatorsAndStrategies(stockAPIInstance: StockAPI): Promise<{ fast_sma: number, atr: number, volume: number }> {
        return new Promise(async (resolve, reject) => {
            const indicators = await stockAPIInstance.get9SMAAndVolumeForPreviousMinute(this.symbol);
            const indicators2 = await stockAPIInstance.getATRAndVolumeForPreviousMinute(this.symbol);
            if (indicators.fast_sma === -1 || indicators.volume === -1 || indicators2.atr === -1) {
                resolve({ fast_sma: -1, atr: -1, volume: -1 });
                return;
            }
            this.lastEMAs.push(indicators.fast_sma);
            this.lastVolumes.push(indicators.volume);
            resolve({ fast_sma: indicators.fast_sma, atr: indicators2.atr, volume: indicators.volume });
        });
    }
}