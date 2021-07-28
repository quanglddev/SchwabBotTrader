import PriceUpdate from "@/models/FinnHub/PriceUpdate";
import PriceUpdateStream from "@/models/FinnHub/PriceUpdateStream";

export const convertStreamToPriceUpdates = (stream: PriceUpdateStream): Array<PriceUpdate> => {
    if (!stream.data || stream.data.length === 0) {
        return [];
    }

    const uniqueTickers = stream.data.map((datum) => datum.s!).filter((value, index, self) => self.indexOf(value) === index);

    const priceUpdates: Array<PriceUpdate> = [];
    uniqueTickers.forEach((ticker) => {
        const prices = stream.data!.filter((datum) => datum.s === ticker).map((datum) => datum.p!);
        const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const newTickerPrice = new PriceUpdate(ticker, averagePrice);
        priceUpdates.push(newTickerPrice);
    });

    return priceUpdates;
}