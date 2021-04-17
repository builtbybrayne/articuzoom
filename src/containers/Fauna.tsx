import React, {useCallback, useMemo, useState} from 'react';
import faunadb, {query as q} from "faunadb"
import {Collection, Status} from "../types";
import {GAME_ID, GameType, Suggestion} from "./State";

const FaunaContext = React.createContext<any>(null);

export const client = new faunadb.Client({secret: 'fnAEElAO2rACB7g-H5Zma58SyjESdnHTOqLimsTn'});

export function Fauna({children}) {
    return <FaunaContext.Provider value={client}>
        {children}
    </FaunaContext.Provider>
}


export function useFetch(fn) {
    const [loaded, setLoaded] = useState(false);
    const [status, setStatus] = useState(Status.Empty);
    const [error, setError] = useState();
    const [data, setData] = useState();


    const fetch = useCallback(async (...args) => {
        setStatus(Status.Fetching);

        try {
            const result = await fn(...args);
            setStatus(Status.Done);
            setData(result);
            setError(undefined);
            setLoaded(true);

        } catch (error) {
            console.log('ERROR', error);
            setStatus(Status.Error);
            setData(undefined);
            setError(error);
            setLoaded(true);
        }
    }, [setData, setStatus, setError, setLoaded, fn]);

    return useMemo(() => ({fetch, status, error, data, loaded} as {
        fetch: (...args) => void,
        status: Status,
        data: any,
        error: undefined | Error,
        loaded: boolean
    }), [fetch, status, error, data, loaded]);
}

export async function getAllRecords(collection: Collection) {
    console.log('GET ALL', collection);
    return await client.query(q.Paginate(q.Documents(q.Collection(collection))));
}

export async function getRecord(collection: Collection, id: string) {
    console.log('GET', collection, id);
    return await client.query(q.Get(q.Ref(q.Collection(collection), id)));
}

export async function createRecord(collection: Collection, data: object) {
    console.log('Created', collection, data);
    return await client.query(q.Create(q.Collection(collection), {data}));
}

export async function updateRecord(collection: Collection, id: string, data: object) {
    console.log('Update', collection, id, data);
    return await client.query(q.Update(q.Ref(q.Collection(collection), id), {data}));
}

export async function updateSuggestion(id: string, suggestion: Partial<Suggestion>) {
    return await updateRecord('suggestions', id, suggestion);
}

export async function updateGame(state: Partial<GameType>) {
    return await updateRecord('games', GAME_ID, state);
}

export async function replaceRecord(collection: Collection, id: string, data: object) {
    console.log('Replace', collection, id, data);
    return await client.query(q.Replace(q.Ref(q.Collection(collection), id), {data}));
}

export async function deleteRecord(collection: Collection, id: string) {
    console.log('DETLE', collection, id);
    return await client.query(q.Delete(q.Ref(q.Collection(collection), id)));
}


export async function resolveAllRecords(collection: Collection): Promise<Suggestion[]> {
    const records = await getAllRecords(collection) as any;
    const all = await Promise.all(records.data.map(async (record) => {
        const {id} = record.value;
        const {data} = await getRecord(collection, id) as any;
        return {id, ...data};
    }));
    return all as Suggestion[];
}

