import { Grid } from "../game/grid";
import { Card, getSuits, Suit } from "../game/card";
import { createCardElement } from "./ui";

function suitRowID(suit: Suit): string {
    const suitString = suit.toStringShort();
    return `game-board-row-${suitString}`;
}

export function renderGrid(grid: Grid) {
    const boardEl = document.getElementById("game-board")!;
    boardEl.innerHTML = '';
    getSuits().reverse().forEach(
        suit => {
            const el = document.createElement('div');
            el.id = suitRowID(suit);
            boardEl.appendChild(el);
        }
    )
    const possibleStops = grid.possibleStops;
    const possibleStopCardStrings = possibleStops.map(gridEntry => gridEntry.card.toStringShort());
    console.log("stops");
    console.log(possibleStopCardStrings);
    // TODO: might we need a rank above AND below? can that happen?
    grid.allCards.forEach(
        gridEntry => {
            const card = gridEntry.card;
            const parentEl = document.getElementById(suitRowID(card.suit))!;
            let cardSpec: string;
            if (gridEntry.data === null) {
                cardSpec = 'absent';
            } else if (gridEntry.data.faceup) {
                cardSpec = card.toStringShort();
            } else {
                cardSpec = 'back';
            }
            const el = createCardElement(cardSpec);
            parentEl.appendChild(el);
            if (gridEntry.data !== null) {
                if (gridEntry.data.trick !== null) {
                    const player = gridEntry.data.players!.playerPlayed;
                    const lead = (gridEntry.data.trick.cardInTrickNumber === 1);
                    const markerEl = document.createElement('div');
                    markerEl.classList.add('marker');
                    markerEl.classList.add(`marker-${player.name}`);
                    if (lead) {
                        markerEl.classList.add('marker-lead');
                    }
                    el.appendChild(markerEl);
                } else if (gridEntry.data.players !== null && !gridEntry.data.faceup) {
                    const owner = gridEntry.data.players.playerOwned!;
                    const markerEl = document.createElement('div');
                    markerEl.classList.add('marker');
                    markerEl.classList.add(`marker-${owner.name}`);
                    markerEl.classList.add(`marker-owned`);
                    el.appendChild(markerEl);
                    const stopEntries = possibleStops.filter(ge => Card.cardEquals(ge.card, gridEntry.card));
                    if (stopEntries.length > 0){
                        const stopMarkerEl = document.createElement('div');
                        const player = gridEntry.data.players!.playerPlayed;
                        stopMarkerEl.classList.add('marker');
                        stopMarkerEl.classList.add(`marker-${player.name}`);
                        stopMarkerEl.classList.add(`marker-stops`);
                        el.appendChild(stopMarkerEl);
                    }
                }
            }
        }
    );
}