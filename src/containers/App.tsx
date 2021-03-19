import React, {useState} from 'react';
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import PrimeReact from 'primereact/api';
import {gameState, playerState, State, suggestionsState, usePlayer} from "./State";
import {Expand} from "../components/Expand";
import styled from 'styled-components';
import {Fauna} from "./Fauna";
import {Suggestions} from "./Suggestions";
import {useRecoilState} from "recoil";
import {InputText} from "primereact/inputtext";
import {Button} from "primereact/button";
import {AppBar} from "./AppBar";
import {Game} from "./Game";
import {GameFetcher, Refetcher, SuggestionsFetcher} from "./DataFetchers";

PrimeReact.ripple = true;

function App() {
    return (
        <State>
            <Fauna>
                <GameFetcher/>
                <SuggestionsFetcher/>
                <Refetcher/>
                <Window>
                    <AppBar/>
                    <Main/>
                </Window>
            </Fauna>
        </State>
    );
}

const Window = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

function Main() {
    const [game] = useRecoilState(gameState);
    const [player] = useRecoilState(playerState);
    const [suggestions] = useRecoilState(suggestionsState);
    console.log('GAME', game);

    if (!game) {
        return <Expand>
            <div>Loading game...</div>
        </Expand>
    }
    if (!player) {
        return <Expand>
            <NameSelector/>
        </Expand>
    }
    if (suggestions.length === 0) {
        return <Suggestions/>;
    }

    switch (game.state) {
        case "":
            return <Suggestions/>;
        default:
            return <Game/>

    }
}


function NameSelector() {
    const [, setPlayer] = usePlayer();
    const [_name, _setName] = useState('');

    return <Expand>
        <Container className="p-fluid">
            <div className="p-field">
                <label htmlFor="name">What's your name?</label>
                <InputText id='name' value={_name} onChange={(e) => _setName(e.currentTarget.value)}/>
            </div>
            <div className="p-field">
                <Button label="Submit" onClick={() => setPlayer(_name)} disabled={!_name}/>
            </div>
        </Container>
    </Expand>
}

const Container = styled.div`
  max-width: 500px;  
`;

export default App;
