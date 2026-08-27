import { Card, Suit, Rank, arbitraryTopRank, getCard, getNextRankUp, getFullPack, getSuits, rankTTWithRespectTo, getNextCardDown, getNextCardUp } from "./card";
import { Player } from "./player";

type trickData = {
    player: Player,
    cardInTrickNumber: number,
    touchingGrid: boolean,
}

// TODO: rethink model to track stops
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

    constructor(private _topRank: Rank | null = null) {
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
        // TODO: should we do padding here?
        const gridEntries = Object.values(this.cards);
        gridEntries.sort(
            (g1, g2) => {
                return 100 * (g1.card.suit.rankForTrumpPreference - g2.card.suit.rankForTrumpPreference) +
                    (rankTTWithRespectTo(g1.card.rank, this.topRank) - rankTTWithRespectTo(g2.card.rank, this.topRank));
            }
        );
        return gridEntries
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

    get permanentGrid(): GridEntry[] {
        return this.allCards.filter(
            gridEntry => this.isInPermanentGrid(gridEntry.card)
        );
    }


// what about something like:
// 234
//   4567
//      789TJ
//          JQKA2
// answer: we always build up one at a time, so have an explict top rank always.
// we cannot consistently derive from consituent cards

    get topRank(): Rank {
        if (this._topRank === null) {
            // this should only be the case for empty grids
            return arbitraryTopRank;
        }
        return this._topRank;
    }

    get bottomRank(): Rank {
        return getNextRankUp(this.topRank)
    }

    get trumpSuit(): Suit {
        // current rules:
        // shortest suit
        // lowest rank
        // ties broken by a fixed suit hierarchy
        const permanentGrid = this.permanentGrid;
        const allSuits = getSuits();
        const suitsData: [Suit, number, number][] = allSuits.map(
            suit => {
                const suitGrid = permanentGrid.filter(
                    gridEntry => Suit.suitEquals(gridEntry.card.suit, suit)
                );
                return [
                    suit,
                    suitGrid.length,
                    Math.min(
                        ...suitGrid.map(
                            gridEntry => rankTTWithRespectTo(gridEntry.card.rank, this.topRank)
                        )
                    ),
                ];
            }
        )
        suitsData.sort(
            (s1, s2) => (-1000 * s1[1] - 10 * s1[2] + s1[0].rankForTrumpPreference) - (-1000 * s2[1] - 10 * s2[2] + s2[0].rankForTrumpPreference)
        )
        // final entry is our trump suit
        return suitsData[suitsData.length - 1][0];
    }

    isInPermanentGrid(card: Card): boolean {
        // cards need to be faceup &
        // not part of a trick
        // or part of a trick that is already touching
        const cardData = this.cards[card.toStringShort()].data;
        return (cardData !== null && cardData.faceup) && (
            cardData.trick === null ||
            cardData.trick.touchingGrid
        );
    }

    isTouchingGrid(card: Card): boolean {
        // this card is definitely touching the grid if
        // the card above or below is in permanent grid
        const cardAbove = getNextCardUp(card);
        const cardBelow = getNextCardDown(card);
        return this.isInPermanentGrid(cardAbove) || this.isInPermanentGrid(cardBelow);
    }

    setTopRank(card: Card) {
        // this only works if:
        // - card below is permanent
        // - card below is already the top rank!
        if (this._topRank === null) {
            this._topRank = card.rank;
            return;
        }
        // if we are entering a card one above one already there, that is the top rank, we set a new top rank!
        const cardBelow = getNextCardDown(card);
        if (this.isInPermanentGrid(cardBelow) && Rank.rankEquals(cardBelow.rank, this.topRank)) {
            this._topRank = card.rank;
            return;
        }
    }

    clone(): Grid {
        const cloned = new Grid(this._topRank);
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
                                touchingGrid: newGridEntry.data.trick.touchingGrid,
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
                "touchingGrid": false,
            }
        }

        this.markTouchingCards();
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

        this.setTopRank(card);
    }

    addNeutralsToGrid(cards: Card[]): void {
        // it probably breaks the logic to add neutrals of an existing suit
        // that aren't above / below existing cards
        // we do not currently enforce this in any way
        cards.forEach(card => this.addNeutralToGrid(card));
    }

    markTouchingCards(): GridEntry[] {
        // we need to go through, make 'permanent' cards that are touching grid
        // then check if other cards are touching grid, and repeat, until we've processed all
        // make sure any cards in trick that are not marked as touching the grid
        // but are, become correctly marked
        const trickEntries = this.currentTrickEntries;
        let unprocessedEntries = trickEntries.filter(ge => !ge.data!.trick!.touchingGrid);
        while (unprocessedEntries.length > 0) {
            let resolvedAny = false;
            for (const gridEntry of unprocessedEntries) {
                const card = gridEntry.card;
                if (this.isTouchingGrid(card)) {
                    resolvedAny = true;
                    gridEntry.data!.trick!.touchingGrid = true;
                    this.setTopRank(card);
                    // TODO: still need to retain stop info, somewhere
                }
            }
            unprocessedEntries = trickEntries.filter(ge => !ge.data!.trick!.touchingGrid);
            // if we didn't resolve any, then none left are touching grid
            // stop trying
            if (!resolvedAny) {
                break;
            }
        }
        return unprocessedEntries;
    }

    resolveTrick(): void {
        // turn down any cards that are not touching grid once the trick is finished
        const trickEntries = this.currentTrickEntries;
        const unprocessedEntries = trickEntries.filter(ge => !ge.data!.trick!.touchingGrid);
        unprocessedEntries.forEach(
            (gridEntry) => {
                const data = gridEntry.data!;
                data.faceup = false;
            }
        )
    }

    resetTrick(): void {
        this.currentTrickEntries.forEach(
            gridEntry => gridEntry.data!.trick = null
        );
    }

    turndown(card: Card): void {
        const cardStr = card.toStringShort();
        this.cards[cardStr].data!.faceup = false;
    }

}
