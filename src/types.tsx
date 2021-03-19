export type Collection = 'suggestions' | 'games';
export enum Status {
    Empty= 'empty',
    Fetching = 'fetching',
    Done = 'done',
    Error = 'error'
}

export type Dict<T> = {[key: string]: T};
