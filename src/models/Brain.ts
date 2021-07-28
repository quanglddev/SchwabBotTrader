import chalk from "chalk";
import _ from 'lodash';

import { ACCEPTABLE_ENTER_RANGE, CONFIRMATION_TIMES, LOSS_TO_PROFIT_RATIO, NEW_HIGH_TARGET_PROFIT_FROM_ENTRY_RATIO, SECONDS_CHECK_BUY, SECONDS_CHECK_SELL, SECONDS_UPDATE_QUOTES, MINUTES_UPDATE_LEVELS } from "@/constants";


import { TradeAction } from "@/models/Level";
import Wallet from "@/models/Wallet";
import Watchlist from "@/models/Watchlist";
import Ticker, { StockDirection } from "@/models/Ticker";
import OptionStrategy, { OptionSentiment } from "./TradeStrategy";
import { print, specialPrint } from "@/utils/PrintHelper";
import StockAPI from "@/models/StockAPI";
import PriceUpdateStream from "./FinnHub/PriceUpdateStream";
import { convertStreamToPriceUpdates } from "@/utils/Converter";
import CommunicationSocket from "./CommunicationSocket";
import { WebDriver } from "selenium-webdriver";
import BrowserBuyOptionSingleTask from "./BrowserTask/BuyOptionSingle";
import BrowserSellOptionSingleTask from "./BrowserTask/SellOptionSingle";

export default class Brain {
    public stockAPIInstance: StockAPI;

    constructor(
        public watchlist: Watchlist,
        stockAPIInstance: StockAPI,
        public communicationSocket: CommunicationSocket
    ) {
        this.stockAPIInstance = stockAPIInstance;
    }

    /**
     * 1. Update lastPrice
     * 2. Update isGoingUp
     * 3. Update levels for that stock
     * 4. Update levels for taken trades
     * 5. Update levels with correct instructions
     * 6. Consider if should buy to open
     * 7. Consider if should sell to close
     */
    periodicallyUpdateQuotes(): void {
        setInterval(async () => {
            for (let i = 0; i < this.watchlist.tickers.length; i++) {
                const ticker = this.watchlist.tickers[i];

                // Price is not yet received through stream
                if (ticker.currentPrice === 0) {
                    continue
                }

                const currentPrice = ticker.currentPrice;

                // 1 & 2
                ticker.lastPrices.push(currentPrice);
                const gradient = ticker.updateDirection();
                const indicators = await ticker.getIndicatorsAndStrategies(this.stockAPIInstance);
                // SYMBOL,CURRENT PRICE,GRADIENT,9 SMA,CANDLE ABOVE 9 SMA,VOLUME,SUM VOLUME
                if (indicators.fast_sma !== -1 && indicators.volume !== -1 && indicators.atr !== -1) {
                    specialPrint(ticker.symbol, `${ticker.symbol},${currentPrice},${gradient},${indicators.fast_sma},${currentPrice >= indicators.fast_sma},${indicators.volume},${ticker.lastVolumes.reduce((a, b) => a + b, 0)},${indicators.atr},${ticker.levels.map((level) => level.value).join('|')}`);
                }

                // 5
                this.checkIfAnySetupsHaveTrigger(ticker);
                // 6
                // await this.buySetupsThatAreConfirmed(ticker);

                print(chalk.gray(`UPDATE: ${ticker.symbol} - ${currentPrice.toFixed(2)} - ${ticker.direction}. GRADIENT: ${gradient}.`));
            }
        }, SECONDS_UPDATE_QUOTES * 1000);
    }

    // periodicallyCheckSetupsAndBuyIfCriteriasMet(): void {
    //     setInterval(async () => {
    //         for (let i = 0; i < this.watchlist.tickers.length; i++) {
    //             const ticker = this.watchlist.tickers[i];

    //             // 5
    //             this.checkIfAnySetupsHaveTrigger(ticker);

    //             // 6
    //             await this.buySetupsThatAreConfirmed(ticker);
    //         }
    //     }, SECONDS_CHECK_BUY * 1000)
    // }

    periodicallyUpdateLevelsForAllTickers(): void {
        setInterval(async () => {
            for (let i = 0; i < this.watchlist.tickers.length; i++) {
                const ticker = this.watchlist.tickers[i];

                // 3 & 4
                await ticker.updateLevels(this.stockAPIInstance);
                ticker.updateTPForTakenTrades();
            }
        }, MINUTES_UPDATE_LEVELS * 60 * 1000);
    }

    periodicallyCheckIfShouldSell(): void {
        setInterval(async () => {
            // 7
            this.sellSetupsThatAreCrossTPOrSL();
        }, SECONDS_CHECK_SELL * 1000);
    }

    checkIfAnySetupsHaveTrigger(ticker: Ticker): void {
        for (let j = 0; j < ticker.levels.length; j++) {
            const level = ticker.levels[j];

            if (ticker.direction === StockDirection.Sideway) {
                continue;
            }
            else if (ticker.direction === StockDirection.Up) {
                const condition1 = _.last(ticker.lastPrices)! > level.value;
                const extendedRange = level.value * (1 + ACCEPTABLE_ENTER_RANGE);
                const condition2 = _.last(ticker.lastPrices)! < extendedRange;
                const condition3 = ticker.takenTrades.length === 0;

                if (condition1 && condition2 && condition3) {
                    level.signals.push(TradeAction.BuyToOpen + OptionSentiment.Bull);
                    print(`TRIGGER ${TradeAction.BuyToOpen} ${ticker.symbol} ${OptionSentiment.Bull} (${level.signals.length}/${CONFIRMATION_TIMES}): ${level.value.toFixed(2)} (LEVEL) < ${_.last(ticker.lastPrices)!.toFixed(2)} (ENTRY) < ${extendedRange.toFixed(2)} (EXTENDED)`);
                }
            }
            else if (ticker.direction === StockDirection.Down) {
                const condition1 = _.last(ticker.lastPrices)! < level.value;
                const extendedRange = level.value * (1 - ACCEPTABLE_ENTER_RANGE);
                const condition2 = _.last(ticker.lastPrices)! > extendedRange;
                const condition3 = ticker.takenTrades.length === 0;

                if (condition1 && condition2 && condition3) {
                    // Must be in buy zone
                    level.signals.push(TradeAction.BuyToOpen + OptionSentiment.Bear);
                    print(`TRIGGER ${TradeAction.BuyToOpen} ${ticker.symbol} ${OptionSentiment.Bear} (${level.signals.length}/${CONFIRMATION_TIMES}): ${level.value.toFixed(2)} (LEVEL) > ${_.last(ticker.lastPrices)!.toFixed(2)} (ENTRY) > ${extendedRange.toFixed(2)} (EXTENDED)`);
                }
            }
        }
    }

    /**
     * 1. Check if CONFIRMATION_TIMES is reached
     * 2. Check if all TRIGGERS are the same (all buy calls or all buy puts, cannot be mixed)
     * 3. Buy with correct TP and SL
     */
    async buySetupsThatAreConfirmed(ticker: Ticker): Promise<void> {
        return new Promise(async (resolve, reject) => {
            for (let j = 0; j < ticker.levels.length; j++) {
                const level = ticker.levels[j];

                // 1
                if (level.signals.length < CONFIRMATION_TIMES) {
                    continue;
                }

                // 2
                const lastActions = level.signals.slice(Math.max(level.signals.length - CONFIRMATION_TIMES, 0));
                const uniqueActions = _.uniq(lastActions);

                // Actions are not in aggreement the number of required confirmation times
                if (uniqueActions.length > 1) {
                    print(`Mixed signals (call and put at the same time). Ignoring this trade...`);
                    level.signals = [];
                    continue;
                }

                // 3
                const uniqueAction = uniqueActions[0];

                if (uniqueAction === TradeAction.BuyToOpen + OptionSentiment.Bull) {
                    // May denied if we don't have enough money
                    let targetLevel = ticker.levels[j + 1];
                    let targetLevelValue = 0.0;
                    if (targetLevel) {
                        targetLevelValue = targetLevel.value;
                    }
                    else {
                        // WILL BREAK IF LEVELS ONLY HAVE ONE VALUE (WHICH IS VERY UNLIKELY)
                        targetLevelValue = level.value * (1 + NEW_HIGH_TARGET_PROFIT_FROM_ENTRY_RATIO);
                    }

                    let stopLevelValue = level.value - (targetLevelValue - level.value) * LOSS_TO_PROFIT_RATIO;

                    await this.buyToOpen(ticker, _.last(ticker.lastPrices)!, level.value, targetLevelValue, stopLevelValue, OptionSentiment.Bull);
                    level.signals = [];
                }
                else if (uniqueAction === TradeAction.BuyToOpen + OptionSentiment.Bear) {
                    // May denied if we don't have enough money
                    let targetLevel = ticker.levels[j - 1];
                    let targetLevelValue = 0.0;
                    if (targetLevel) {
                        targetLevelValue = targetLevel.value;
                    }
                    else {
                        targetLevelValue = level.value * (1 - NEW_HIGH_TARGET_PROFIT_FROM_ENTRY_RATIO);
                    }

                    let stopLevelValue = level.value + (level.value - targetLevelValue) * LOSS_TO_PROFIT_RATIO;

                    await this.buyToOpen(ticker, _.last(ticker.lastPrices)!, level.value, targetLevelValue, stopLevelValue, OptionSentiment.Bear);
                    level.signals = [];
                }
            }
            resolve();
        });
    }

    async sellSetupsThatAreCrossTPOrSL(): Promise<void> {
        for (let i = 0; i < this.watchlist.tickers.length; i++) {
            const ticker = this.watchlist.tickers[i];
            if (ticker.takenTrades.length === 0) {
                continue;
            }

            for (let j = ticker.takenTrades.length - 1; j > -1; j--) {
                const takenTrade = ticker.takenTrades[j];

                // Trade is being placed, not yet
                // TODO: prevent being placed
                if (takenTrade.enterPrice === -1) {
                    print(chalk.bgRed('FEATURE NEEDED: PREVENT ORDER BEING PLACED'));
                    continue;
                }

                const lastPrice = _.last(ticker.lastPrices)!;

                if (takenTrade.sentiment === OptionSentiment.Bull) {
                    // Sell at stop loss
                    if (lastPrice < takenTrade.stopLoss) {
                        await this.sellToClose(takenTrade, lastPrice);
                        ticker.takenTrades.splice(j);
                    }
                    // Update stop loss
                    else if (lastPrice >= takenTrade.profitTarget) {
                        takenTrade.stopLoss = lastPrice;

                        // New target profit
                        const largerTPs = ticker.levels.map((level) => level.value).filter((value) => value > takenTrade.profitTarget);
                        const sortedLargerTPs = _.sortBy(largerTPs);
                        if (sortedLargerTPs.length === 0) {
                            takenTrade.profitTarget = takenTrade.profitTarget * (1 + NEW_HIGH_TARGET_PROFIT_FROM_ENTRY_RATIO);
                        }
                        else {
                            takenTrade.profitTarget = sortedLargerTPs[0];
                        }
                    }
                }
                else if (takenTrade.sentiment === OptionSentiment.Bear) {
                    // Put, sell if above stop loss or reach profit target
                    if (lastPrice > takenTrade.stopLoss) {
                        await this.sellToClose(takenTrade, lastPrice);
                        ticker.takenTrades.splice(j);
                    }
                    else if (lastPrice <= takenTrade.profitTarget) {
                        takenTrade.stopLoss = lastPrice;

                        // New target profit
                        const betterTPs = ticker.levels.map((level) => level.value).filter((value) => value < takenTrade.profitTarget);
                        const sortedBetterTPs = _.sortBy(betterTPs);
                        if (sortedBetterTPs.length === 0) {
                            takenTrade.profitTarget = takenTrade.profitTarget * (1 - NEW_HIGH_TARGET_PROFIT_FROM_ENTRY_RATIO);
                        }
                        else {
                            takenTrade.profitTarget = _.last(sortedBetterTPs)!;
                        }
                    }
                }
            }
        }
    }

    updateTickersCurrentPriceBasedOnStreamData(streamData: PriceUpdateStream) {
        const priceUpdates = convertStreamToPriceUpdates(streamData);

        for (let i = 0; i < this.watchlist.tickers.length; i++) {
            const ticker = this.watchlist.tickers[i];
            const priceUpdate = priceUpdates.find((priceUpdate) => priceUpdate.ticker.toUpperCase() === ticker.symbol.toUpperCase());

            // There's a chance the price update doesn't contain update for the ticker, if so just continue
            if (!priceUpdate) {
                continue;
            }

            // 1
            ticker.currentPrice = priceUpdate.averagePrice;
        }
    }

    async buyToOpen(ticker: Ticker, entryPrice: number, triggerLevelValue: number, targetLevelValue: number, stopLevelValue: number, optionSentiment: OptionSentiment): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const optionInfo = await this.stockAPIInstance.getAppropriateStrikeAndExpirationDateForOptionSentiment(ticker.symbol, optionSentiment);
            const newBuyTask = new BrowserBuyOptionSingleTask(ticker.symbol, optionSentiment, optionInfo.expirationDate, optionInfo.strike, entryPrice, triggerLevelValue, targetLevelValue, stopLevelValue);
            this.communicationSocket.sendBrowserTask(newBuyTask);

            const newTrade = new OptionStrategy(ticker.symbol, optionSentiment, triggerLevelValue, targetLevelValue, stopLevelValue, 1);
            newTrade.enteredExpirationDate = optionInfo.expirationDate;
            newTrade.enteredStrike = optionInfo.strike;

            // Has to be set first to prevent buy again
            ticker.takenTrades.push(newTrade);
            resolve();
        });
    }

    async sellToClose(tradeStrategy: OptionStrategy, sellPrice: number): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const newSellTask = new BrowserSellOptionSingleTask(tradeStrategy.ticker, tradeStrategy.sentiment, tradeStrategy.enteredExpirationDate, tradeStrategy.enteredStrike, sellPrice);
            this.communicationSocket.sendBrowserTask(newSellTask);
            resolve();
        });
    }
}