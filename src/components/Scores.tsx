import React, {useMemo} from 'react';
import {GameType, Suggestion} from "../containers/State";
import {Column} from "primereact/column";
import {DataTable} from "primereact/datatable";
import {Dict} from "../types";
import setProp from 'lodash.set';

export function RoundScores({suggestions} : {suggestions: Suggestion[]}) {
    const data = useMemo(() => {
        const data: Dict<number> = {};
        suggestions.forEach(suggestion => {
            const {winner} = suggestion;
            if (winner) {
                const count = data[winner] || 0;
                data[winner] = count + 1;
            }
        });
        return Object.entries(data).map(([name, count]) => ({name, count}));
    }, [suggestions]);

    return data.length ? <DataTable value={data}>
        <Column field="name" header="Player"/>
        <Column field="count" header="Wins"/>
    </DataTable> : <></>;
}

export function GameScores({game}: {game: GameType}) {
    const {scores={}} = game;

    const data = useMemo(() => {
        const data: Dict<Dict<number>> = {};
        Object.entries(scores).forEach(([round, suggestions]) => {
            suggestions.forEach(suggestion => {
                const {winner} = suggestion;
                if (winner) {
                    const count = data[winner]?.[round] || 0;
                    setProp(data, [winner, round], count + 1);
                }
            })
        });
        return Object.entries(data).map(([name, counts]) => {
            return {
                name,
                ...counts
            };
        });
    }, [scores]);

    return <DataTable value={data}>
        <Column field="name" header="Player"/>
        {Object.keys(scores).map(round => <Column key={round} field={round} header={`Round ${round}`}/>)}
    </DataTable>
}