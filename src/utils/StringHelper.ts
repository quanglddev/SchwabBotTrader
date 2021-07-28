export const replaceAll = (str: string, search: string, replace: string): string => {
    return str.split(search).join(replace);
};