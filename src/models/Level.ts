/**
 * signals will contain 4 values: bc (buy call), sc (sell call), bp (buy put), sp (sell put)
 */
export enum TradeAction {
    BuyToOpen = 'BTO',
    SellToClose = 'STC'
}

export default class Level {
    public signals: Array<string> = [];

    constructor(public value: number) {

    }
}