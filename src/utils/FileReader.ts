import fs from 'fs';
import Ticker, { StockDirection } from '@/models/Ticker';
import Level from '@/models/Level';

const extractLevelFromText = (infos: Array<string>): number => {
    const criteria = parseFloat(infos[2]);
    return criteria;
};

export const extractTickerFromText = (text: string): Ticker => {
    let elems = text.split(' ');
    elems = elems.filter((elem) => !!elem);
    const ticker = elems[0].replace('$', '');
    const level1 = new Level(extractLevelFromText(elems.slice(1, 4)));
    const level2 = new Level(extractLevelFromText(elems.slice(5, 8)));
    const levels = [level1, level2];

    return new Ticker(ticker.toUpperCase(), StockDirection.Sideway, levels, []);
};

export const getTickersFromTextFileHelper = (textFilePath: string): Promise<Array<Ticker>> => {
    return new Promise((resolve, reject) => {
        fs.readFile(textFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                reject(err);
                return;
            }

            const lines = data.split('\n');
            const tickers = lines.map((line) => extractTickerFromText(line.trim()));

            resolve(tickers);
            return;
        });
    });
};