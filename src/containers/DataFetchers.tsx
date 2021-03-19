import {useRecoilState} from "recoil";
import {EMPTY_GAME, GAME_ID, gameFetchState, gameState, inAGoState, suggestionsFetchState, suggestionsState} from "./State";
import {getRecord, resolveAllRecords, useFetch} from "./Fauna";
import React, {useCallback, useEffect} from "react";
import {Status} from "../types";
import {useInterval} from "../utils";

export function GameFetcher() {
    const [, setGame] = useRecoilState(gameState);
    const [, setGameFetch] = useRecoilState(gameFetchState);
    const {data, fetch, status} = useFetch(useCallback(async () => {
        const {data = {}} = await getRecord('games', GAME_ID) as any;
        const _game = {
            ...EMPTY_GAME,
            ...data
        };
        setGame(_game);
        return _game;
    }, [setGame]));


    useEffect(() => {
        if (status === Status.Empty) {
            fetch();
        }
    }, [status, fetch]);
    const [inAGo] = useRecoilState(inAGoState);
    useEffect(() => {
        setGameFetch({fetch, status});
    }, [setGameFetch, fetch, status]);
    return <></>;
}

export function SuggestionsFetcher() {
    const [, setSuggestions] = useRecoilState(suggestionsState);
    const [, setSuggestionsFetch] = useRecoilState(suggestionsFetchState);
    const {fetch, status, error, loaded} = useFetch(useCallback(async () => {
        const records = await resolveAllRecords('suggestions');
        setSuggestions(records);
        return records;
    }, [setSuggestions]));
    useEffect(() => {
        setSuggestionsFetch({fetch, status, loaded, error});
    }, [fetch, status, error, loaded]);
    useEffect(() => {
        fetch();
    }, [fetch]);
    return <></>;
}

export function Refetcher() {
    const refetch = useRefetch();
    useInterval(refetch);
    return <></>;
}

export function useRefetch() {
    const [{fetch: fetchGame}] = useRecoilState(gameFetchState);
    const [{fetch: fetchSuggestions}] = useRecoilState(suggestionsFetchState);
    const [inAGo] = useRecoilState(inAGoState);

    return useCallback(async () => {
        if (!inAGo) {
            await Promise.all([
                fetchGame(),
                fetchSuggestions()
            ]);
        }
    }, [inAGo, fetchGame, fetchSuggestions]);
}
