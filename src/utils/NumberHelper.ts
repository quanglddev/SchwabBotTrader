export const findClosestUpperWholeNumber = (num: number): number => {
    const roundedNumber = Math.round(num);
    return roundedNumber + 2;
}

export const findClosestLowerWholeNumber = (num: number): number => {
    const roundedNumber = Math.round(num);
    return roundedNumber - 2;
}