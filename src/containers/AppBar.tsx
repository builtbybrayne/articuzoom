import styled from 'styled-components';
import React, {useCallback, useState} from 'react';
import {Toolbar} from "primereact/toolbar";
import {EMPTY_GAME, GAME_ID, gameState, suggestionsState, usePlayer, viewOverrideState} from "./State";
import {Button} from "primereact/button";
import {deleteRecord, replaceRecord, updateRecord} from "./Fauna";
import {useRecoilState} from "recoil";
import {Sidebar} from 'primereact/sidebar';
import {useSetState} from "./Game";
import {useRefetch} from "./DataFetchers";

export function AppBar() {
    const [player, setPlayer] = usePlayer();
    const refetch = useRefetch();
    const [game] = useRecoilState(gameState);
    const [suggestions] = useRecoilState(suggestionsState);
    const setState = useSetState();
    const [viewOverride, setViewOverride] = useRecoilState(viewOverrideState);

    const resetGame = useCallback(async () => {
        await replaceRecord('games', GAME_ID, EMPTY_GAME);
        await Promise.all(suggestions.map(async suggestion => {
            await deleteRecord('suggestions', suggestion.id);
        }));
        await setState("");
        await refetch();
    }, [suggestions, setState, refetch]);
    const [visibleSidebar, setVisibleSidebar] = useState(false);

    const nextRound = useCallback(async () => {
        await Promise.all(suggestions.map(async suggestion => {
            await updateRecord('suggestions', suggestion.id, {
                winner: ''
            });
        }));
        const {scores={}, round} = game!;
        const newScores = {
            ...scores,
            [round]: [...suggestions]
        };
        await updateRecord('games', GAME_ID, {
            round: round + 1,
            scores: newScores
        });
        await refetch()
    }, [suggestions, game, refetch]);

    const endGame = useCallback(async () => {
        await nextRound();
        await setState('ended');
        await refetch();
    }, [nextRound, setState, refetch]);

    const viewIdeas = useCallback(() => {
        setViewOverride('');
        setState('');
    }, [setState, setViewOverride]);
    const goStart = useCallback(() => {
        setViewOverride('');
        setState('started');
    }, [setState, setViewOverride]);
    const viewScores = useCallback(() => {
        setViewOverride('scores');
    }, [setViewOverride]);

    if (!player || !game) {
        return <></>;
    }

    const topLeft = <>
        <AppBarButton icon='pi pi-list' label='Ideas' onClick={() => viewIdeas()} disabled={game?.state === 'started'}/>
        <AppBarButton icon='pi pi-play' label='Game' onClick={() => goStart()} disabled={(viewOverride !== 'scores' && game?.state === 'started') || suggestions.length === 0}/>
        <AppBarButton icon='pi pi-align-left' label='Scores' onClick={() => viewScores()} disabled={suggestions.length === 0} />
    </>;
    const bottomRight = <>
        <AppBarButton icon='pi pi-forward' label='Next Round' onClick={() => nextRound()} disabled={game?.turn}/>
        <AppBarButton icon='pi pi-eject' label='End' onClick={() => endGame()} disabled={game?.turn}/>
    </>;
    const topRight = <>
        <AppBarButton style={{marginLeft: '1rem'}} icon='pi pi-align-justify' onClick={() => setVisibleSidebar(true)}/>
    </>;
    const bottomLeft = <h2>Round {game?.round}</h2>;
    return <>
        <Toolbar left={topLeft} right={topRight}/>
        {game?.state === 'started' && viewOverride !== 'scores' && <Toolbar left={bottomLeft} right={bottomRight}/>}
        <Sidebar visible={visibleSidebar} onHide={() => setVisibleSidebar(false)} position='right'>
            <h5>{player}</h5>
            <SidebarButton icon='pi pi-sign-out' onClick={() => setPlayer('')} label="Logout"/>
            <SidebarButton className='p-button p-button-danger' icon='pi pi-ban' onClick={() => resetGame()} label="Reset Game for Everyone"/>
        </Sidebar>
    </>;
}

const AppBarButton = styled(Button)`
    margin-left: 0.2rem;
    margin-right: 0.2rem;
`;
const SidebarButton = styled(Button)`
    margin-bottom: 1rem;
`;
