import React, {useCallback, useEffect} from 'react';
import {atom, RecoilRoot, useRecoilState,} from 'recoil';
import {Expand} from "../components/Expand";
import {useLocalStorage} from "../utils";
import {Dict, Status} from "../types";

export function State({children}: React.PropsWithChildren<any>) {
    return <RecoilRoot>
        <GlobalErrorHandler>
            {children}
        </GlobalErrorHandler>
    </RecoilRoot>
}

function GlobalErrorHandler({children}) {
    const [error] = useRecoilState(globalErrorState);
    if (error) {
        return <Expand>
            Err: {JSON.stringify(error)}
        </Expand>
    }
    return children;
}

export const EMPTY_FETCH: {
    fetch: (...args: any[]) => void,
    loaded: boolean,
    status: Status,
    error: undefined | Error
} = {
    fetch: () => {},
    loaded: false,
    status: Status.Empty,
    error: undefined
};

export const globalErrorState = atom<any>({
    key: 'globalError',
    default: null
});

export const GAME_ID = '293413155535585799';

export type ViewOverride = '' | 'scores';
export const viewOverrideState = atom<ViewOverride>({
    key: 'viewOverride',
    default: ''
});

export type GameState = '' | 'started' | 'ended';
export type GameType = {
    id: string;
    turn: string;
    state: GameState;
    round: number,
    scores?: {[k: number]: Suggestion[]}
}
export const EMPTY_GAME = {
    id: GAME_ID,
    turn: '',
    state: '',
    round: 1
};
export const gameState = atom<GameType | undefined>({
    key: 'game',
    default: undefined
});
export const gameFetchState = atom<{ fetch: () => void, status: Status }>({
    key: 'gameFetch',
    default: EMPTY_FETCH
});


export const gamesState = atom<any>({
    key: 'games',
    default: ''
});

export const inAGoState = atom<boolean>({
    key: 'inago',
    default: false
});

export type Suggestion = {
    id: string;
    name: string;
    owner: string;
    ts: number;
    winner: string;
}
export const suggestionsState = atom<Suggestion[]>({
    key: 'suggestions',
    default: []
});
export const suggestionsFetchState = atom({
    key: 'suggestionsFetch',
    default: EMPTY_FETCH
});


export type Player = string;
export const playerState = atom<Player>({
    key: 'player',
    default: ''
});

export function usePlayer() {
    const [player, setPlayer] = useRecoilState(playerState);
    const [localPlayer, setLocalPlayer] = useLocalStorage('player', '');

    useEffect(() => {
        if (!player && localPlayer) {
            setPlayer(localPlayer)
        }
    }, [localPlayer, setPlayer, player]);

    const updatePlayer = useCallback((name) => {
        setPlayer(name);
        setLocalPlayer(name);
    }, [setPlayer, setLocalPlayer]);

    return [player, updatePlayer] as [Player, (player: Player) => void];
}
