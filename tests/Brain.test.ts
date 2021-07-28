import fs from 'fs';
import path from 'path';
import { rootPath } from 'get-root-path';
import Brain from '../src/models/Brain';
import Wallet from '../src/models/Wallet';
import FinnHubAPI from '../src/models/FinnHubAPI';
import Watchlist from '../src/models/Watchlist';
import Level from '../src/models/Level';
import PriceHistory from '../src/models/TDA/PriceHistory';
import BrowserController from '../src/models/BrowserController';
import { SPY } from '../assets/tests/spy_quotes_data_sample';


const ASSETS_BASE = path.join(rootPath, 'assets', 'tests');


test('buy calls when the price is above the criteria', async () => {
    const wallet = new Wallet();
    const buyMock = jest.spyOn(wallet, 'buyToOpen').mockImplementation(() => Promise.resolve());
    const finnhubAPIInstance = new FinnHubAPI();
    const priceHistories: Array<PriceHistory> = SPY;
    const priceHistoriesPricesOnly = priceHistories.map((priceHistory) => priceHistory.close);
    jest.spyOn(finnhubAPIInstance, 'getSupportResistance').mockImplementation(() => {
        const level1 = new Level(435.16);
        const level2 = new Level(436.41);
        const level3 = new Level(437.24);
        const level4 = new Level(437.84);
        const result = [level1, level2, level3, level4];
        return Promise.resolve(result);
    });

    const watchlist = new Watchlist(finnhubAPIInstance);
    await watchlist.loadTickersBasedOnDay();
    const browserController = new BrowserController(watchlist);
    const brain = new Brain(wallet, watchlist, browserController, finnhubAPIInstance);
    // brain.periodicallyUpdateQuotesAndMakeDecisions();
    // jest.spyOn(brain, 'periodicallyUpdateQuotesAndMakeDecisions').mockImplementationOnce(() => {
    //     let priceUpdatedCount = 0;
    //     let checkBuyCount = 0;

    //     const updatePriceTimer = setInterval(async () => {
    //         if (priceUpdatedCount > 4 * 9) {
    //             clearInterval(updatePriceTimer);
    //             return;
    //         }
    //         for (let i = 0; i < brain.watchlist.tickers.length; i++) {
    //             const ticker = brain.watchlist.tickers[i];

    //             const currentPrice = await brain.finnhubAPIInstance.getQuote(ticker.symbol);
    //             // expect(currentPrice).toBe(priceHistoriesPricesOnly[priceUpdatedCount])

    //             // 1 & 2
    //             ticker.lastPrices.push(currentPrice);
    //             const gradient = ticker.updateDirection();
    //         }

    //         priceUpdatedCount += 1;
    //     }, 1);

    //     const checkBuyTimer = setInterval(async () => {
    //         if (checkBuyCount > 3) {
    //             clearInterval(checkBuyTimer);
    //             return;
    //         }

    //         for (let i = 0; i < brain.watchlist.tickers.length; i++) {
    //             const ticker = brain.watchlist.tickers[i];

    //             // 3 & 4
    //             await ticker.updateLevels(brain.finnhubAPIInstance);
    //             ticker.updateTPForTakenTrades();

    //             // 5
    //             brain.checkIfAnySetupsHaveTrigger();

    //             // 6
    //             await brain.buySetupsThatAreConfirmed();
    //         }

    //         checkBuyCount += 1;
    //     }, 3 * 60 / 15);
    // });

    // expect(buyMock.mock.calls.length).toBe(0);
});