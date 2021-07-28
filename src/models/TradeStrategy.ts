export enum OptionSentiment {
    Bull = 'C',
    Bear = 'P'
}

export default class OptionStrategy {
    public enterPrice: number = -1;
    public enteredStrike: number = -1;
    public enteredExpirationDate: Date = new Date();
    public exitPrice: number = -1;

    constructor(
        public ticker: string,
        public sentiment: OptionSentiment,
        public triggerCriteria: number = 0.0,
        public profitTarget: number = 0.0,
        public stopLoss: number = 0.0,
        public positionSize: number = 0
    ) { }
}