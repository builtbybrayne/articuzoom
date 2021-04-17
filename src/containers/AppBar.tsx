import styled from 'styled-components';
import React, {useCallback, useState} from 'react';
import {Toolbar} from "primereact/toolbar";
import {EMPTY_GAME, GAME_ID, gameState, suggestionsState, usePlayer, viewOverrideState} from "./State";
import {Button} from "primereact/button";
import {deleteRecord, replaceRecord, updateGame, updateSuggestion} from "./Fauna";
import {useRecoilState} from "recoil";
import {Sidebar} from 'primereact/sidebar';
import {useSetState} from "./Game";
import {useRefetch} from "./DataFetchers";

export function AppBar() {
    const [player] = usePlayer();
    const refetch = useRefetch();
    const setState = useSetState();
    const [game] = useRecoilState(gameState);
    const [suggestions] = useRecoilState(suggestionsState);
    const [viewOverride, setViewOverride] = useRecoilState(viewOverrideState);

    const nextRound = useCallback(async () => {
        await Promise.all(suggestions.map(async suggestion => {
            await updateSuggestion(suggestion.id, {
                winner: ''
            });
        }));
        const {round} = game!;
        await updateGame({
            turn: '',
            round: round + 1,
            scores: {
                [round]: [...suggestions]
            }
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
        <AppBarButton icon='pi pi-sign-in' label='Game' onClick={() => goStart()} disabled={(viewOverride !== 'scores' && game?.state === 'started') || suggestions.length === 0}/>
        <AppBarButton icon='pi pi-align-left' label='Scores' onClick={() => viewScores()} disabled={suggestions.length === 0}/>
    </>;
    const bottomRight = <>
        <AppBarButton icon='pi pi-forward' label='Next Round' onClick={() => nextRound()} disabled={game?.turn} className='p-button-warning'/>
        <AppBarButton icon='pi pi-eject' label='End' onClick={() => endGame()} disabled={game?.turn} className='p-button-danger'/>
    </>;
    const topRight = <>
        <Admin />
    </>;
    const bottomLeft = <h3 style={{margin: 0}}>Round {game?.round}</h3>;
    return <>
        <Toolbar left={topLeft} right={topRight}/>
        {game?.state === 'started' && viewOverride !== 'scores' && <Toolbar left={bottomLeft} right={bottomRight}/>}
    </>;
}

function Admin() {
    const [player, setPlayer] = usePlayer();
    const [game] = useRecoilState(gameState);
    const [visible, setVisible] = useState(false);
    const [suggestions] = useRecoilState(suggestionsState);
    const refetch = useRefetch();
    const setState = useSetState();

    const resetGame = useCallback(async () => {
        await replaceRecord('games', GAME_ID, EMPTY_GAME);
        await Promise.all(suggestions.map(async suggestion => {
            await deleteRecord('suggestions', suggestion.id);
        }));
        await setState("");
        await refetch();
    }, [suggestions, setState, refetch]);


    const {scores} = game || {};
    const removeRound = useCallback(async (round) => {
        if (scores) {
            const newScores = {
                ...scores,
                [round]: []
            };
            await updateGame({
                scores: newScores
            });
            // await refetch(); ??
        }
    }, [scores]);
    const roundRemovalButtons = scores ? Object.keys(scores).map(round => <SidebarButton className='p-button p-button-secondary' icon='pi pi-trash' onClick={() => removeRound(round)} label={`Delete round ${round}`}/>) : undefined;

    return <>
        <AppBarButton style={{marginLeft: '1rem'}} icon='pi pi-align-justify' onClick={() => setVisible(true)}/>
        <Sidebar visible={visible} onHide={() => setVisible(false)} position='right' icons={() => (
            <h5 style={{width: '100%', paddingLeft: '0.5rem'}}>{player}</h5>
        )}>
            <SidebarButton icon='pi pi-sign-out' onClick={() => setPlayer('')} label="Logout"/>
            <SidebarButton className='p-button p-button-danger' icon='pi pi-refresh' onClick={() => resetGame()} label="Delete all ideas and game state"/>

            {roundRemovalButtons && roundRemovalButtons.length ? <h4>Rounds</h4> : undefined}
            {roundRemovalButtons}
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
