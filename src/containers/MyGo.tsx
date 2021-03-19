import styled from 'styled-components';
import {useRecoilState} from "recoil";
import {GAME_ID, inAGoState, Suggestion, suggestionsState, usePlayer} from "./State";
import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import Countdown from "react-countdown";
import {Section} from "../components/Container";
import {Button} from "primereact/button";
import {updateRecord} from "./Fauna";
import {Divider} from "primereact/divider";
import {useRefetch} from "./DataFetchers";

export function MyGo() {
    const [player] = usePlayer();
    const [suggestions] = useRecoilState(suggestionsState);
    const refetch = useRefetch();
    const [, setInAGo] = useRecoilState(inAGoState);
    const previousWins = useMemo(() => suggestions.filter(suggestion => suggestion.winner === player), [suggestions, player]);
    const initialSuggestions = useMemo(() => shuffle(suggestions.filter(suggestion => !suggestion.winner)), [suggestions]);
    const [remaining, setRemaining] = useState(initialSuggestions);
    const [selected, setSelected] = useState<Suggestion[]>([]);
    const [wins, setWins] = useState<Suggestion[]>([]);
    const [started, setStarted] = useState<'' | 'started' | 'ended'>('');

    console.log('...STARTED', started);
    console.log('...REMAINING', remaining);
    console.log('...SELECTED', selected);
    console.log('...WINS', wins);

    const start = useCallback(() => {
        const [head, ...rest] = remaining;
        setRemaining(rest);
        if (head) setSelected([...selected, head]);
        setStarted('started');
        setInAGo(true);
    }, [selected, setSelected, setRemaining, remaining, setStarted, setInAGo]);

    const giveUp = useCallback(async () => {
        await updateRecord('games', GAME_ID, {turn: ''});
        await refetch();
    }, [refetch]);

    const win = useCallback((suggestion) => {
        const [head, ...rest] = remaining;
        setRemaining(rest);
        let _selected = selected.filter(s => s.id !== suggestion.id);
        if (head) {
            _selected = [..._selected, head];
        }
        setSelected(_selected);
        setWins([...wins, suggestion]);
    }, [selected, setSelected, wins, setWins, remaining, setRemaining]);

    const pass = useCallback(() => {
        if (selected.length < 2 && remaining.length) {
            const [head, ...rest] = remaining;
            setRemaining(rest);
            setSelected([...selected, head]);
        }
    }, [selected, setSelected, remaining, setRemaining]);

    const done = useCallback(async () => {
        setStarted('ended');
        await Promise.all(wins.map(async win => {
            await updateRecord('suggestions', win.id, {
                winner: player
            });
        }));
        await updateRecord('games', GAME_ID, {
            turn: ''
        });
        setInAGo(false);

    }, [setStarted, wins, player, setInAGo]);

    const bail = useCallback(() => {
        const [head, ...tail] = [...remaining, ...selected];
        setRemaining(tail);
        setSelected([head]);
    }, [remaining, setRemaining, selected, setSelected, start]);

    useEffect(() => {
        if (started === 'started' && remaining.length === 0 && selected.length === 0) {
            done();
        }
    }, [started, remaining.length, done, selected.length]);

    const timeRef = useRef<number>();

    switch (started) {
        case 'started':
            if (!timeRef.current) {
                timeRef.current = Date.now() + 60000
            }
            return <>
                <Section>
                    <CardBlock>
                        {selected.map(suggestion => <Card key={suggestion.id} suggestion={suggestion}>
                            <Button label='Got it!' icon='pi pi-check' onClick={() => win(suggestion)} className='p-button-success'/>
                        </Card>)}
                    </CardBlock>
                </Section>
                <Section>
                    <Button label='Pass' icon='pi pi-refresh' onClick={() => pass()} disabled={selected.length === 2 || !remaining.length} className='p-button-warning'/>
                </Section>
                <Section>
                    <Countdown
                        date={timeRef.current}
                        autoStart={true}
                        onComplete={() => done()}
                        renderer={({total}) => {
                            const seconds = total / 1000;
                            return <Time className='p-shadow-3' style={{background: `hsl(${100 * seconds / 60}, 60%, 60%)`}}>{total / 1000}</Time>;
                        }}
                    />
                </Section>
                <Section>
                    <Divider/>
                </Section>
                <Section>
                    <Button label='Reject current options' icon='pi pi-ban' onClick={() => bail()} className='p-button-secondary' disabled={selected.length < 2 || !remaining.length}/>
                </Section>
                <Section>
                    <Button icon='pi pi-step-forward' label='Give up' onClick={done} className='p-button-danger'/>
                </Section>
                <Section></Section>
                <Divider/>
                <Section>
                    <h2>Wins ({wins.length})</h2>
                    <WinBlock>
                        {wins.map(suggestion => <Win key={suggestion.id} suggestion={suggestion}/>)}
                    </WinBlock>
                </Section>
                <Section>
                    <WinBlock>
                        <h3>Previous Wins: ({previousWins.length})</h3>
                    </WinBlock>
                </Section>
            </>;

        case 'ended':
            return <>
                <Section>
                    <h2>Wins ({wins.length})</h2>
                    <WinBlock>
                        {wins.map(suggestion => <Win key={suggestion.id} suggestion={suggestion}/>)}
                    </WinBlock>
                </Section>
                <Section>
                    <Button icon='pi pi-check' label='End go' onClick={done}/>
                </Section>
                <Section>
                    <WinBlock>
                        <h3>Previous Wins: ({previousWins.length})</h3>
                    </WinBlock>
                </Section>
            </>;

        default:
            return <>
                <Section>
                    <Button icon='pi pi-play' label='Go!' onClick={start}/>
                </Section>
                <Section>
                    <Button icon='pi pi-minus-circle' label='Give up turn' onClick={giveUp} className='p-button-secondary'/>
                </Section>
                <Section>
                    <WinBlock>
                        <h3>Previous Wins: ({previousWins.length})</h3>
                    </WinBlock>
                </Section>
            </>
    }
}

const CardBlock = styled.div`
  display: flex;
  flex-direction: column;
`;
const CardStyle = styled.div`
  width: 100%;
  margin: 1rem;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
   .name {
   flex: 1 1 auto;
      font-weight: bold;
      font-size: 2rem;
   }
   .right {
    flex: 0 0 auto
   }
`;

function Card({suggestion, children}: { suggestion: Suggestion, children?: JSX.Element }) {
    return <CardStyle><span className='name'>{suggestion.name}</span> <span className='right'>{children}</span></CardStyle>
}


const WinBlock = styled.div`
  display: flex;
  flex-direction: row;

`;
const WinStyle = styled.div`
  margin: 1rem;
`;

function Win({suggestion}) {
    return <WinStyle>{suggestion.name}</WinStyle>
}

const Time = styled.div`
  margin: 0 auto;
  padding: 2rem;
  width: 6rem;
  height: 6rem;
  background: hsl(100, 60%, 60%);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.66rem;
  font-size: 4rem;
  color: whitesmoke;
`;


function shuffle(a) {
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}
