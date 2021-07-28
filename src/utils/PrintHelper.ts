import fs from 'fs';
import path from 'path';
import { rootPath } from 'get-root-path';
import { getDateMMDDYYYYFormatFilenameFriendly } from './DateHelper';
import { replaceAll } from './StringHelper';

export const print = (str: string): void => {
    console.log(str);

    const journalName = `${getDateMMDDYYYYFormatFilenameFriendly()}_commands.txt`;
    const journalPath = path.join(rootPath, 'logs', journalName);
    const currentTime = new Date();
    const timeString = `${currentTime.toLocaleDateString()} ${currentTime.toLocaleTimeString()}`;

    const withoutChalkString = replaceAll(replaceAll(replaceAll(replaceAll(replaceAll(replaceAll(replaceAll(replaceAll(replaceAll(str, '[0m', ''), '[7m', ''), '[27m', ''), '[32m', ''), '[39m', ''), '[35m', ''), '[90m', ''), '[41m', ''), '\n', '\n                      ');

    const content = `${timeString}: ${withoutChalkString}\n`;
    fs.writeFile(journalPath, content, { flag: 'a+' }, err => {
        if (err) {
            console.error(`Error writing on command journal: ${journalName} (${err})`);
        }
    });
}

export const specialPrint = (tickerSymbol: string, str: string): void => {
    console.log(str);

    const journalName = `${getDateMMDDYYYYFormatFilenameFriendly()}_specials_${tickerSymbol}.txt`;
    const journalPath = path.join(rootPath, 'logs', journalName);
    const currentTime = new Date();
    const timeString = `${currentTime.toLocaleDateString()} ${currentTime.toLocaleTimeString()}`;

    const withoutChalkString = replaceAll(replaceAll(replaceAll(replaceAll(replaceAll(replaceAll(replaceAll(replaceAll(replaceAll(str, '[0m', ''), '[7m', ''), '[27m', ''), '[32m', ''), '[39m', ''), '[35m', ''), '[90m', ''), '[41m', ''), '\n', '\n                      ');

    const content = `${timeString}: ${withoutChalkString}\n`;
    fs.writeFile(journalPath, content, { flag: 'a+' }, err => {
        if (err) {
            console.error(`Error writing on command journal: ${journalName} (${err})`);
        }
    });
}