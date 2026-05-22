import { Card, getFullPack } from "./card";
import { Player } from "./player";

type GridEntry = {
    card: Card,
    player: Player | null,
    faceup: boolean | null,
}

export class Grid {
    private cards: {[key: string]: GridEntry};

    constructor() {
        const pack = getFullPack();
        this.cards = Object.fromEntries(
            pack.map(
                card => [
                    card.toStringShort(),
                    {"card": card, "player": null, "faceup": null}
                ]
            )
        );
    }

    play(card: Card, player: Player): void {
        const cardStr = card.toStringShort();
        if (this.cards[cardStr].player !== null) {
            throw Error(`Card already played! ${card}`)
        }

        this.cards[cardStr].player === player;
        this.cards[cardStr].faceup === true;
    }

    turndown(card: Card): void {
        const cardStr = card.toStringShort();
        this.cards[cardStr].faceup === false;
    }
}
