import { Card, getFullPack } from "./card";
import { Player } from "./player";

type CardData = {
    player: Player,
    faceup: boolean,
    currentTrick: boolean,
    lead: boolean,
}

type GridEntry = {
    card: Card,
    data: CardData | null,
}

export class Grid {
    private cards: {[key: string]: GridEntry};

    constructor() {
        const pack = getFullPack();
        this.cards = Object.fromEntries(
            pack.map(
                card => [
                    card.toStringShort(),
                    {"card": card, "data": null}
                ]
            )
        );
    }

    play(card: Card, player: Player): void {
        const cardStr = card.toStringShort();
        if (this.cards[cardStr].data !== null) {
            throw Error(`Card already played! ${card}`)
        }

        this.cards[cardStr].data = {
            "player": player,
            "faceup": true,
            "currentTrick": true,
            "lead": true,  // TODO
        }
    }

    turndown(card: Card): void {
        const cardStr = card.toStringShort();
        this.cards[cardStr].data!.faceup = false;
    }
}
