import { Card, Suit, Rank, topRank, getCard, getNextRankUp, getFullPack, getSuits } from "./card";
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

    get allCards(): GridEntry[] {
        // keep as a getter to give us flexibility
        // TODO: should we do rank logic / padding here?
        return Object.values(this.cards);
    }

    get neutralCards(): GridEntry[] {
        return Object.values(this.cards).filter(
            gridEntry => gridEntry.data !== null && gridEntry.data.trick === null
        );
    }

    get currentTrick(): [Card, Player][] {
        const gridJustTrick = this.currentTrickEntries;
        gridJustTrick.sort((e1, e2) => e1.data!.trick!.cardInTrickNumber! - e2.data!.trick!.cardInTrickNumber!);
        return gridJustTrick.map(
            gridEntry => [gridEntry.card, gridEntry.data!.trick!.player]
        )
    }

    get contiguousGrid(): {[key: string]: [Card, Card]} {
        // for each suit:
        const highestLowestsBySuit: [Suit, [Rank, Rank]][] = getSuits().map(
            suit => {
                // suit cards that are not part of a trick, and which are faceup
                const suitCards = Object.values(this.cards).filter(
                    gridEntry => gridEntry.data !== null && gridEntry.data.trick === null && gridEntry.data.faceup
                ).map(
                    gridEntry => gridEntry.card
                );
                // (2, 3), (3, 4), (4, 5)
                // {3, 4, 5}
                const pointedToRanks = new Set(suitCards.map(card => card.rank.ttRankAbove));
                // lowest card is the single one that is not pointed to
                // (2, 3)
                const lowest = suitCards.filter(card => !pointedToRanks.has(card.rank.trickTakingRank));
                // if all are pointed to, then we return the top rank as stored
                if (lowest.length === 0){
                    if (this._topRank === null) {
                        throw new Error(`Should have a top rank: ${this}`);
                    }
                    return [suit, [getNextRankUp(this._topRank), this._topRank]];
                }
                if (lowest.length > 1) {
                    throw Error(`grid error: ${lowest}`);
                }
                const lowestCard = lowest[0];

                // (2, 3), (3, 4), (4, 5)
                // {2, 3, 4}
                const pointedFromRanks = new Set(suitCards.map(card => card.rank.trickTakingRank));
                // highest card is the single one that points into the 'void'
                // (4, 5)
                const highest = suitCards.filter(card => !pointedFromRanks.has(card.rank.ttRankAbove));
                if (highest.length > 1) {
                    throw Error(`grid error: ${highest}`);
                }
                const highestCard = highest[0];
                return [suit, [lowestCard.rank, highestCard.rank]];

            }
        )

        return Object.fromEntries(
            highestLowestsBySuit.map(
                ([suit, [lowRank, highRank]]) => {
                    return [suit.toStringShort(), [getCard(lowRank, suit), getCard(highRank, suit)]];
                }
            )
        );
    }


// what about something like:
// 234
//   4567
//      789TJ
//          JQKA2

    get topRank(): Rank {
        if (this._topRank === null) {
            // TODO: derive this from the grid
            return topRank;
        }
        return this._topRank;
    }

    get bottomRank(): Rank {
        return getNextRankUp(this.topRank)
    }

    clone(): Grid {
        const cloned = new Grid();
        cloned.cards = Object.fromEntries(
            Object.entries(this.cards).map(
                ([cardString, gridEntry]) => {
                    let newGridEntry: GridEntry = {
                        card: gridEntry.card,
                        data: gridEntry.data,
                    };
                    if (newGridEntry.data !== null) {
                        newGridEntry.data = {
                            faceup: newGridEntry.data.faceup,
                            trick: newGridEntry.data.trick,
                        }
                        if (newGridEntry.data.trick !== null) {
                            newGridEntry.data.trick = {
                                player: newGridEntry.data.trick.player.clone(),
                                cardInTrickNumber: newGridEntry.data.trick.cardInTrickNumber,
                            };
                        }
                    }
                    return [cardString, newGridEntry];
                }
            )
        );
        return cloned;
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

    addNeutralsToGrid(cards: Card[]): void {
        cards.forEach(card => this.addNeutralToGrid(card));
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
