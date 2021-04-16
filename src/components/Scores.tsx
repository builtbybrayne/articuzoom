import React, {useMemo} from 'react';
import {GameType, Suggestion} from "../containers/State";
import {Column} from "primereact/column";
import {DataTable} from "primereact/datatable";
import {Dict} from "../types";
import setProp from 'lodash.set';
import getProp from 'lodash.get';

export function RoundScores({suggestions}: { suggestions: Suggestion[] }) {
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

    return <div className="p-shadow-1">
        <DataTable value={data}>
            <Column field="name" header="Player"/>
            <Column field="count" header="Wins"/>
        </DataTable>
    </div>;
}

export function GameScores({game}: { game: GameType }) {
    const {scores} = game;

    const data = useMemo(() => {
        const data: Dict<Dict<number>> = {};
        if (scores) {
            Object.entries(scores).forEach(([round, suggestions]) => {
                suggestions.forEach(suggestion => {
                    const {winner} = suggestion;
                    if (winner) {
                        const count = data[winner]?.[round] || 0;
                        const total = data[winner]?.total || 0;
                        setProp(data, [winner, round], count + 1);
                        setProp(data, [winner, 'total'], total + 1);
                    }
                })
            });
        }
        return Object.entries(data).map(([name, counts]) => {
            return {
                name,
                ...counts
            };
        });
    }, [scores]);

    console.log('DATA', data);

    return <div className="p-shadow-1">
        <DataTable
            value={data}
            autoLayout
            scrollable
            className='p-datatable-striped'
        >
            <Column field="name" header="Player" style={{fontWeight: 'bold'}}/>
            {scores ? Object.keys(scores).map(round => <Column key={round} field={round} header={`Round ${round}`}/>) : undefined}
            <Column field="total" header="Total" style={{fontWeight: 'bold'}}/>
        </DataTable>
    </div>
}
