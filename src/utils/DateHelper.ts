import { replaceAll } from "./StringHelper";

export const getDateMMDDYYYYFormat = (date: Date = new Date()): string => {
    const mm = date.getMonth() + 1; // getMonth() is zero-based
    const dd = date.getDate();

    return [
        (mm > 9 ? '' : '0') + mm,
        (dd > 9 ? '' : '0') + dd,
        date.getFullYear()
    ].join('/');
}

export const getDateYYYYMMDDFormat = (date: Date = new Date()): string => {
    const mm = date.getMonth() + 1; // getMonth() is zero-based
    const dd = date.getDate();

    return [
        date.getFullYear(),
        (mm > 9 ? '' : '0') + mm,
        (dd > 9 ? '' : '0') + dd,
    ].join('-');
}

export const getMinutesBeforeFromNow = (minutesAfter: number): Date => {
    const currentDate = new Date();
    currentDate.setMinutes(currentDate.getMinutes() - minutesAfter);
    return currentDate;
};

export const getDaysAfterFromNow = (daysAfter: number): Date => {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + daysAfter);
    return currentDate;
}

export const getDateMMDDYYYYFormatFilenameFriendly = (date: Date = new Date()): string => {
    return replaceAll(getDateMMDDYYYYFormat(date), '/', '_');
}

export const isWeekend = (): boolean => {
    const currentDate = new Date();
    if (currentDate.getDay() === 6 || currentDate.getDay() === 0) {
        return true;
    }
    return false;
}

export const isLottoFriday = (): boolean => {
    const currentDate = new Date();
    return currentDate.getDay() === 5;
}

export const getClosesDateForDay = (dayOfWeek: number): Date => {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + (dayOfWeek + 7 - currentDate.getDay()) % 7);
    return currentDate;
};

export const getClosestWedOrFriInString = (): string => {
    const closetWednesday = getClosesDateForDay(3);
    const closetFriday = getClosesDateForDay(5);
    const closetDateInMillisecond = Math.min(closetWednesday.getTime(), closetFriday.getTime());
    const closetDate = new Date(closetDateInMillisecond);
    return getDateMMDDYYYYFormat(closetDate);
}

/**
 * TODO: Account for weekend and holiday
 */
export const isMarketOpen = (): boolean => {
    const currentTime = new Date();
    if ((currentTime.getHours() >= 9 && currentTime.getMinutes() > 30) || currentTime.getHours() <= 15) {
        // Do nothing because market is open
        // Account for weekend here
        return true;
    }
    return false;
};