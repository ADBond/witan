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
    grid.neutralCards.forEach(
        gridEntry => {
            const card = gridEntry.card;
            const parentEl = document.getElementById(suitRowID(card.suit))!;
            const el = createCardElement(card.toStringShort())
            parentEl.appendChild(el);
        }
    );
}