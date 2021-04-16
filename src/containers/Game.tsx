import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import {useRecoilState} from "recoil";
import {GAME_ID, GameState, gameState, GameType, playerState, suggestionsState, viewOverrideState} from "./State";
import {updateRecord} from "./Fauna";
import {Container, Section} from "../components/Container";
import {Button} from "primereact/button";
import {MyGo} from "./MyGo";
import {GameScores, RoundScores} from "../components/Scores";
import {useRefetch} from "./DataFetchers";
import Countdown from "react-countdown";
import {Time} from "../components/Time";


export function useUpdateGame() {
    const refetch = useRefetch();
    return useCallback(async (data: Partial<GameType>) => {
        await updateRecord('games', GAME_ID, data);
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


    let content;
    if (game?.state === 'ended' || viewOverride === 'scores') {
        content = <Ended game={game}/>;

    } else if (!game?.turn) {
        content = <Scores player={player} />

    } else if (game?.turn === player) {
        content = <IsMyGo/>

    } else {
        content = <NotMyGo turn={game?.turn} countdownTarget={game?.countdownTarget} />
    }

    return <Container>
        {content}
    </Container>
}

function Ended({game}) {
    return <>
        <h3>Scores</h3>
        <GameScores game={game!} />
    </>
}

function Complete({suggestions}) {
    return <Section>
        <h3>Round complete</h3>
        <RoundScores suggestions={suggestions}/>
    </Section>
}

function Scores({player}) {
    const refetch = useRefetch();
    const claimGo = useCallback(async () => {
        await updateRecord('games', GAME_ID, {turn: player});
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


function IsMyGo() {
    const [suggestions] = useRecoilState(suggestionsState);
    const remaining = useMemo(() => suggestions.filter(suggestion => !suggestion.winner), [suggestions]);

    if (!remaining.length) {
        return <Complete suggestions={suggestions}/>;
    } else {
        return <MyGo />;
    }
}


function NotMyGo({turn, countdownTarget}) {
    const timeRef = useRef<number>(countdownTarget);
    timeRef.current = countdownTarget;

    console.log('RERENDER', turn, countdownTarget);
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
                    return <Time className='p-shadow-3' style={{background: `hsl(${100 * seconds / 60}, 60%, 60%)`}}>{total / 1000}</Time>;
                }}
            />
        </Section>
    </React.Fragment>
}
