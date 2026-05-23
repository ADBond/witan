import { Card, Rank, getNextRankUp, getFullPack } from "./card";
import { Player } from "./player";

type trickData = {
    player: Player,
    cardInTrickNumber: number,
}

type CardData = {
    faceup: boolean,
    trick: trickData | null,
}

type GridEntry = {
    card: Card,
    data: CardData | null,
}

export class Grid {
    private cards: {[key: string]: GridEntry};
    private _topRank: Rank | null = null;

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
            gridEntry => gridEntry.data !== null && gridEntry.data.trick !== null
        );
        gridJustTrick.sort((e1, e2) => e1.data!.trick!.cardInTrickNumber! - e2.data!.trick!.cardInTrickNumber!);
        return gridJustTrick.map(
            gridEntry => [gridEntry.card, gridEntry.data!.trick!.player]
        )
    }

    get topRank(): Rank {
        if (this._topRank === null) {
            // TODO: derive this from the grid
            return new Rank('dummy', -1, -1, -1);
        }
        return this._topRank;
    }

    get bottomRank(): Rank {
        return getNextRankUp(this.topRank)
    }

    clone(): Grid {
        return this;  // TODO
    }

    play(card: Card, player: Player, cardInTrickNumber: number): void {
        const cardStr = card.toStringShort();
        if (this.cards[cardStr].data !== null) {
            throw Error(`Card already in grid ${card}`)
        }

        this.cards[cardStr].data = {
            "faceup": true,
            "trick": {
                "player": player,
                "cardInTrickNumber": cardInTrickNumber,
            }
        }
    }

    addNeutralToGrid(card: Card): void {
        const cardStr = card.toStringShort();
        if (this.cards[cardStr].data !== null) {
            throw Error(`Card already in grid! ${card}`)
        }
        this.cards[cardStr].data = {
            "faceup": true,
            "trick": null,
        };
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
