import { Card, Rank, getNextRankUp, getCardFromString, getFullPack } from "./card";
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

    get currentTrickEntries(): GridEntry[] {
        return Object.values(this.cards).filter(
            gridEntry => gridEntry.data !== null && gridEntry.data.trick !== null
        );
    }

    get currentTrick(): [Card, Player][] {
        const gridJustTrick = this.currentTrickEntries;
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

    addNeutralsToGrid(cards: string[]): void {
        cards.forEach(card => this.addNeutralToGrid(getCardFromString(card)));
    }

    resetTrick(): void {
        // TODO: turndown isolated cards
        this.currentTrickEntries.forEach(
            (gridEntry) => gridEntry.data!.trick = null
        )
    }

    turndown(card: Card): void {
        const cardStr = card.toStringShort();
        this.cards[cardStr].data!.faceup = false;
    }

}
