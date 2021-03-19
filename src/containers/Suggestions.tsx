import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {DataTable} from 'primereact/datatable';
import {useRecoilState} from "recoil";
import {playerState, suggestionsFetchState, suggestionsState, usePlayer} from "./State";
import {createRecord, deleteRecord, resolveAllRecords, useFetch} from "./Fauna";
import {Column} from "primereact/column";
import {Card} from "primereact/card";
import {Status} from "../types";
import {Button} from "primereact/button";
import {InputText} from "primereact/inputtext";
import {Container, Section} from "../components/Container";


export function Suggestions() {
    const [player] = useRecoilState(playerState);
    const [suggestions] = useRecoilState(suggestionsState);
    const [{fetch, status, error, loaded}] = useRecoilState(suggestionsFetchState);

    const remove = useCallback(async (id) => {
        await deleteRecord('suggestions', id);
        await fetch();
    }, [fetch]);

    const mySuggestions = useMemo(() => {
        return suggestions
            .filter(suggestion => suggestion.owner === player)
    }, [player, suggestions]);

    let content;
    if (status === Status.Error) {
        content = <Card title={'Error'}>{error ? error.message : 'Unidentified error state'}</Card>;

    } else if (status === Status.Empty || !loaded) {
        content = <div>Loading suggestions...</div>

    } else {
        const ActionButtons = (rowData) => {
            return <Button label="Delete" icon='pi pi-trash' onClick={() => remove(rowData.id)}/>;
        };

        content = <>
            <DataTable value={mySuggestions} sortField="ts" sortOrder={-1}>
                <Column field="name" header="My Ideas"/>
                <Column field="actions" header="Actions" body={ActionButtons}/>
            </DataTable>
            <p style={{color: 'grey', marginTop: '2rem'}}>(You won't see other people's ideas)</p>
        </>
    }

    return <Container>
        <Section>
            <Actions fetchSuggestions={fetch}/>
        </Section>
        <Section>
            {content}
        </Section>
    </Container>
}


function Actions({fetchSuggestions}) {
    const [player] = usePlayer();
    const [suggestion, setSuggestion] = useState('');
    const submit = useCallback(async (name) => {
        await createRecord('suggestions', {
            name,
            owner: player,
            ts: new Date().getTime()
        });
        await fetchSuggestions();
        setSuggestion('');
    }, [fetchSuggestions, setSuggestion, player]);

    return <Section className="p-fluid">
        <div className="p-field">
            <label htmlFor="name">Add Idea</label>
            <InputText id='name' value={suggestion} onChange={(e) => setSuggestion(e.currentTarget.value)}/>
        </div>
        <div className="p-field">
            <Button label="Submit" onClick={() => submit(suggestion)} disabled={!suggestion}/>
        </div>
    </Section>
}
