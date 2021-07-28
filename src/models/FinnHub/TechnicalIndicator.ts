export default class TechnicalIndicator {
    constructor(
        public c: Array<number> = [],
        public h: Array<number> = [],
        public l: Array<number> = [],
        public o: Array<number> = [],
        public s: string = "",
        public sma: Array<number> = [],
        public atr: Array<number> = [],
        public t: Array<number> = [],
        public v: Array<number> = []
    ) {

    }
}