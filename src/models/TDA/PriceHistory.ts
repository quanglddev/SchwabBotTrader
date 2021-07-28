export default class PriceHistory {
    constructor(
        public open: number,
        public high: number,
        public low: number,
        public close: number,
        public volume: number,
        public datetime: number
    ) { }
}