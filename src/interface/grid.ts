import { Grid } from "../game/grid";
import { getSuits, Suit } from "../game/card";
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
    // TODO: need all cards, and ordered by rank
    // display as present, missing, or backed
    // TODO: markers as well
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
        }
    );
}