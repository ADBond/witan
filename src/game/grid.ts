import { Card, getFullPack } from "./card";
import { Player } from "./player";

type CardData = {
    player: Player,
    faceup: boolean,
    cardInTrickNumber: number | null,
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

    get currentTrick(): [Card, Player][] {
        const gridJustTrick = Object.values(this.cards).filter(
            gridEntry => gridEntry.data !== null && gridEntry.data.cardInTrickNumber !== null
        );
        gridJustTrick.sort((e1, e2) => e1.data!.cardInTrickNumber! - e2.data!.cardInTrickNumber!);
        return gridJustTrick.map(
            gridEntry => [gridEntry.card, gridEntry.data!.player]
        )
    }

    clone(): Grid {
        return this;  // TODO
    }

    play(card: Card, player: Player, cardInTrickNumber: number): void {
        const cardStr = card.toStringShort();
        if (this.cards[cardStr].data !== null) {
            throw Error(`Card already played! ${card}`)
        }

        this.cards[cardStr].data = {
            "player": player,
            "faceup": true,
            "cardInTrickNumber": cardInTrickNumber,
        }
    }

    resetTrick(): void {
        // TODO: turndown isolated cards
        // TODO: remove current trick markers
    }

    turndown(card: Card): void {
        const cardStr = card.toStringShort();
        this.cards[cardStr].data!.faceup = false;
    }

}
