import 'reflect-metadata';
import { jsonObject, jsonMember, jsonArrayMember } from 'typedjson';

@jsonObject
class PriceUpdateStreamData {
    @jsonMember(Number)
    public p: number;

    @jsonMember(String)
    public s: string;

    constructor(p: number, s: string) {
        this.p = p;
        this.s = s;
    }
}

@jsonObject
export default class PriceUpdateStream {
    @jsonArrayMember(PriceUpdateStreamData)
    public data: Array<PriceUpdateStreamData>;

    constructor(data: Array<PriceUpdateStreamData>) {
        this.data = data;
    }
}