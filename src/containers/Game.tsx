import React, {useCallback, useMemo} from 'react';
import {useRecoilState} from "recoil";
import {GAME_ID, GameState, gameState, GameType, playerState, suggestionsState, viewOverrideState} from "./State";
import {updateRecord} from "./Fauna";
import {Container, Section} from "../components/Container";
import {Button} from "primereact/button";
import {MyGo} from "./MyGo";
import {GameScores, RoundScores} from "../components/Scores";
import {useRefetch} from "./DataFetchers";


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
    const refetch = useRefetch();
    const [suggestions] = useRecoilState(suggestionsState);
    const [viewOverride] = useRecoilState(viewOverrideState);

    const remaining = useMemo(() => suggestions.filter(suggestion => !suggestion.winner), [suggestions]);

    const claimGo = useCallback(async () => {
        await updateRecord('games', GAME_ID, {turn: player});
        await refetch();
    }, [refetch, player]);

    let content;
    if (game?.state === 'ended' || viewOverride === 'scores') {
        content = <>
            <h3>Scores</h3>
            <GameScores game={game!} />
        </>;

    } else if (!remaining.length) {
        content = <Section>
            <h3>Round complete</h3>
            <RoundScores suggestions={suggestions}/>
        </Section>

    } else if (!game?.turn) {
        content = <>
            <Section>
                <Button icon='pi pi-play' label="It's my turn" onClick={() => claimGo()}/>
            </Section>
            <Section>
                <RoundScores suggestions={suggestions}/>
            </Section>
        </>

    } else if (game?.turn === player) {
        content = <MyGo/>;

    } else {
        content = <div>It's {game.turn}'s go at the moment</div>
    }

    return <Container>
        {content}
    </Container>
}

