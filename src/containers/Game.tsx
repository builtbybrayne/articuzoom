import React, {useCallback, useEffect, useRef} from 'react';
import {atom, useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";
import {GameState, gameState, GameType, playerState, Suggestion, suggestionsState, viewOverrideState} from "./State";
import {updateGame} from "./Fauna";
import {Container, Section} from "../components/Container";
import {Button} from "primereact/button";
import {MyGo} from "./MyGo";
import {GameScores, RoundScores} from "../components/Scores";
import {useRefetch} from "./DataFetchers";
import Countdown from "react-countdown";
import {Time} from "../components/Time";

const RemainingState = atom<Suggestion[]| null>({
    key: 'remainingState',
    default: null
});


export function useUpdateGame() {
    const refetch = useRefetch();
    return useCallback(async (data: Partial<GameType>) => {
        await updateGame(data);
        await refetch();
    }, [refetch]);
}

export function useSetState() {
    const updateGame = useUpdateGame();
    return useCallback(async (state: GameState) => {
        await updateGame({state});
    }, [updateGame])
}

export function Game() {
    const [player] = useRecoilState(playerState);
    const [game] = useRecoilState(gameState);
    const [viewOverride] = useRecoilState(viewOverrideState);
    const remaining = useRecoilValue(RemainingState);

    console.log('======', game, remaining, player, viewOverride);
    let content;
    if (game?.state === 'ended' || viewOverride === 'scores') {
        content = <Ended game={game}/>;

    } else if (remaining?.length === 0) {
        content = <Complete />;

    } else if (!game?.turn) {
        content = <ClaimGo player={player}/>

    } else if (game?.turn === player) {
        content = <MyGo/>

    } else {
        content = <NotMyGo turn={game?.turn} countdownTarget={game?.countdownTarget} />
    }

    return <Container>
        <SuggestionWatcher/>
        {content}
    </Container>
}

function SuggestionWatcher() {
    const [suggestions] = useRecoilState(suggestionsState);
    const setRemaining = useSetRecoilState(RemainingState);
    useEffect(() => {
        const remaining = suggestions.filter(suggestion => !suggestion.winner);
        setRemaining(remaining);
    }, [suggestions, setRemaining]);
    return <></>;
}

function Ended({game}) {
    return <>
        <h3>Scores</h3>
        <GameScores game={game!} />
    </>
}

function Complete() {
    const [suggestions] = useRecoilState(suggestionsState);

    return <Section>
        <h3>Round complete</h3>
        <RoundScores suggestions={suggestions}/>
    </Section>
}

function ClaimGo({player}) {
    const refetch = useRefetch();
    const claimGo = useCallback(async () => {
        await updateGame({
            turn: player,
        });
        await refetch();
    }, [refetch, player]);

    const [suggestions] = useRecoilState(suggestionsState);
    return <>
        <Section>
            <Button icon='pi pi-sign-in' label="It's my turn" onClick={() => claimGo()}/>
        </Section>
        <Section>
            <RoundScores suggestions={suggestions}/>
        </Section>
    </>
}



function NotMyGo({turn, countdownTarget}) {
    const timeRef = useRef<number>(countdownTarget);
    timeRef.current = countdownTarget;

    return <React.Fragment>
        <Section>
            <div>It's {turn}'s go at the moment</div>
        </Section>
        <Section>
            {!countdownTarget && <div>Waiting for {turn} to start...</div>}
            <Countdown
                key={timeRef.current || 'dead'}
                date={timeRef.current}
                onStart={() => console.log('STARTED')}
                onComplete={() => console.log('COMPLETE')}
                onMount={() => console.log('MOUNT')}
                onPause={() => console.log('PAUSE')}
                onStop={() => console.log('STOP')}
                renderer={({total}) => {
                    let seconds = total / 1000;
                    if (seconds < 0 ) {
                        seconds = 0;
                    }
                    return <Time className='p-shadow-3' style={{background: `hsl(${100 * seconds / 60}, 60%, 60%)`}}>{seconds}</Time>;
                }}
            />
        </Section>
    </React.Fragment>
}
