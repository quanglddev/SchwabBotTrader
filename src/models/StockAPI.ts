import fetch, { Response } from 'node-fetch';
import chalk from 'chalk';

import { print } from "@/utils/PrintHelper";

import SupportResistanceResponse from './FinnHub/SupportResistanceResponse';
import Level from '@/models/Level';
import { FINNHUB_TOKEN, TDA_API_KEY } from '@/constants';
import QuoteResponse from './FinnHub/QuoteResponse';
import { OptionSentiment } from './TradeStrategy';
import { getDateYYYYMMDDFormat, getDaysAfterFromNow, getMinutesBeforeFromNow } from '@/utils/DateHelper';
import TechnicalIndicator from './FinnHub/TechnicalIndicator';
import _ from 'lodash';

export default class StockAPI {
    private FINNHUB_BASE_URL: string = 'https://finnhub.io/api/v1';
    private TDA_BASE_URL: string = 'https://api.tdameritrade.com/v1';

    constructor() {
        print(chalk.green('SUCCESS'));
    }

    public getSupportResistance(tickerSymbol: string, resolution: string): Promise<Array<Level>> {
        return new Promise((resolve, reject) => {
            const URL = `${this.FINNHUB_BASE_URL}/scan/support-resistance?symbol=${tickerSymbol.toUpperCase()}&resolution=${resolution}&token=${FINNHUB_TOKEN}`;
            fetch(URL)
                .then((response: Response) => response.json())
                .then(data => data as SupportResistanceResponse)
                .then(supportResistanceData => {
                    const levels = supportResistanceData.levels.map((value) => new Level(value));
                    resolve(levels);
                    return;
                })
                .catch((error) => reject(error));
        });
    };

    public get9SMAAndVolumeForPreviousMinute(tickerSymbol: string): Promise<{ fast_sma: number, volume: number }> {
        return new Promise((resolve, reject) => {
            const time10MinsBefore = Math.round(getMinutesBeforeFromNow(12).getTime() / 1000);
            const time1MinsBefore = Math.round(getMinutesBeforeFromNow(1).getTime() / 1000);
            const URL = `${this.FINNHUB_BASE_URL}/indicator?symbol=${tickerSymbol}&resolution=1&from=${time10MinsBefore}&to=${time1MinsBefore}&indicator=sma&timeperiod=9&token=${FINNHUB_TOKEN}`;
            console.log(URL)
            fetch(URL)
                .then((response: Response) => response.json())
                .then(data => data as TechnicalIndicator)
                .then(technicalData => {
                    if (technicalData.s === 'no_data') {
                        resolve({ fast_sma: -1, volume: -1 });
                        return;
                    }
                    if (technicalData.sma.length === 0 || technicalData.v.length === 0) {
                        resolve({ fast_sma: -1, volume: -1 });
                        return;
                    }
                    const last9SMA = _.last(technicalData.sma)!;
                    const volume = _.last(technicalData.sma)!;
                    resolve({ fast_sma: last9SMA, volume: volume });
                    return;
                })
                .catch((error) => reject(error));
        });
    }

    public getATRAndVolumeForPreviousMinute(tickerSymbol: string): Promise<{ atr: number, volume: number }> {
        return new Promise((resolve, reject) => {
            const time10MinsBefore = Math.round(getMinutesBeforeFromNow(10).getTime() / 1000);
            const time1MinsBefore = Math.round(getMinutesBeforeFromNow(1).getTime() / 1000);
            const URL = `${this.FINNHUB_BASE_URL}/indicator?symbol=${tickerSymbol}&resolution=1&from=${time10MinsBefore}&to=${time1MinsBefore}&indicator=atr&timeperiod=3&token=${FINNHUB_TOKEN}`;
            fetch(URL)
                .then((response: Response) => response.json())
                .then(data => data as TechnicalIndicator)
                .then(technicalData => {
                    if (technicalData.s === 'no_data') {
                        resolve({ atr: -1, volume: -1 });
                        return;
                    }
                    if (technicalData.atr.length === 0 || technicalData.v.length === 0) {
                        resolve({ atr: -1, volume: -1 });
                        return;
                    }
                    const lastATR = _.last(technicalData.atr)!;
                    const volume = _.last(technicalData.atr)!;
                    resolve({ atr: lastATR, volume: volume });
                    return;
                })
                .catch((error) => reject(error));
        });
    }

    public async getAppropriateStrikeAndExpirationDateForOptionSentiment(tickerSymbol: string, optionSentiment: OptionSentiment): Promise<{ strike: number, expirationDate: Date }> {
        return new Promise((resolve, reject) => {
            const optionInfos: Array<{ strike: number, expirationDate: Date }> = [];
            const fromDate = getDateYYYYMMDDFormat();
            const toDate = getDateYYYYMMDDFormat(getDaysAfterFromNow(14))
            const URL = `${this.TDA_BASE_URL}/marketdata/chains?apikey=${TDA_API_KEY}&symbol=${tickerSymbol.toUpperCase()}&contractType=ALL&strikeCount=5&strategy=SINGLE&fromDate=${fromDate}&toDate=${toDate}`;
            fetch(URL)
                .then((response: Response) => response.json())
                .then(data => {
                    if (data.status === 'SUCCESS') {
                        const obj = optionSentiment === OptionSentiment.Bull ? data.callExpDateMap : data.putExpDateMap;
                        Object.entries(obj).forEach(([key, value]) => {
                            const expirationDate = new Date(key.split(':')[0]);
                            Object.entries(value as {}).forEach(([key2, value2]) => {
                                const strike = parseFloat(key2);
                                optionInfos.push({ strike, expirationDate });
                            });
                        });

                        // Chose the middle strike and closest expiration date
                        const currentDate = new Date();
                        console.log(optionInfos)
                        const closestExpirationDateOption = optionInfos.reduce((prev, cur) => {
                            return (Math.abs(cur.expirationDate.getTime() - prev.expirationDate.getTime()) < Math.abs(prev.expirationDate.getTime() - currentDate.getTime()) ? cur : prev);
                        });
                        console.log(closestExpirationDateOption)
                        const allOptionsThatAreClose = optionInfos.filter((optionInfo) => optionInfo.expirationDate.getDate() === closestExpirationDateOption.expirationDate.getDate());
                        console.log(allOptionsThatAreClose)
                        const allOptionsThatAreCloseSorted = allOptionsThatAreClose.sort((a, b) => {
                            return a.strike - b.strike;
                        });

                        console.log(allOptionsThatAreCloseSorted)
                        resolve(allOptionsThatAreCloseSorted[2 + (optionSentiment === OptionSentiment.Bull ? 1 : -1)]);
                        return;
                    }
                    else {
                        console.error('Cannot get option chain');
                        reject();
                    }
                })
                .catch((error) => reject(error));
        });
    }

    // public getQuote(tickerSymbol: string): Promise<number> {
    //     return new Promise((resolve, reject) => {
    //         const URL = `${this.BASE_URL}/quote?symbol=${tickerSymbol}&token=${this.token}`;
    //         fetch(URL)
    //             .then((response: Response) => response.json())
    //             .then(data => data as QuoteResponse)
    //             .then((quoteData) => {
    //                 const currentPrice = quoteData.c;
    //                 resolve(currentPrice);
    //                 return;
    //             })
    //             .catch((error) => reject(error));
    //     });
    // }
}