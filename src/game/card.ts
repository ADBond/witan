export class Rank {
    constructor(
        public name: string,
        public trickTakingRank: number,
        public ttRankBelow: number,
        public ttRankAbove: number,
        public count_value: number,
    ) { }

    toString(): string {
        return this.name;
    }

    toStringShort(): string {
        return this.name[0];
    }

    toJSON() {
        return this.toStringShort();
    }

    static rankEquals(r1: Rank, r2: Rank): boolean {
        return r1.name === r2.name;
    }
}

export function rankTTWithRespectTo(rank: Rank, topRankWRT: Rank): number {
    const ttr = rank.trickTakingRank;
    if (ttr > topRankWRT.trickTakingRank) {
        return ttr - 20;
    }
    return ttr;
}

// No absolute trump preference but framework for the ranking
export class Suit {
    constructor(public name: string, public rankForTrumpPreference: number, public html: string) { }

    get rankForSorting(): number {
        if (this.rankForTrumpPreference === 0) { 
            return 10;
        }
        return this.rankForTrumpPreference;
    }

    toString(): string {
        return this.name;
    }

    toStringShort(): string {
        return this.name[0];
    }

    toJSON() {
        return this.toStringShort();
    }

    static suitEquals(s1: Suit, s2: Suit): boolean {
        return s1.name === s2.name;
    }
}

export class Card {
    constructor(public suit: Suit, public rank: Rank, public index: number) { }

    toString(): string {
        return `${this.rank.toString()} of ${this.suit.toString()}`;
    }

    toStringShort(): string {
        return `${this.rank.toStringShort()}${this.suit.toStringShort()}`;
    }

    toJSON() {
        return this.toStringShort();
    }

    get html(): string {
        return `${this.rank.toStringShort()}${this.suit.html}`;
    }

    public nextCardUp(pack: Card[]): Card {
        /*
        From a given pack, return the next card up from the current one (in suit)
        */
        const ttrRank = this.rank.ttRankAbove;
        const suit = this.suit;
        const matchingCards = pack.filter(
            card => Suit.suitEquals(card.suit, suit) && (card.rank.trickTakingRank === ttrRank)
        )
        if (matchingCards.length !== 1) {
            console.log(`Error in nextCardUp: ${matchingCards}`);
        }
        return matchingCards[0];
    }

    static cardEquals(c1: Card, c2: Card): boolean {
        return Rank.rankEquals(c1.rank, c2.rank) && Suit.suitEquals(c1.suit, c2.suit);
    }

    static cardFromIndex(index: number, pack: Card[]): Card {
        const cards = pack.filter(card => card.index === index);
        if (cards.length !== 1) {
            console.log(`Error in cardFromIndex: ${cards}`);
        }
        return cards[0];
    }

    static lowestCards(cards: Card[]): Card[] {
        const lowestRank = Math.min(...cards.map(card => card.rank.trickTakingRank));
        const lowestCards = cards.filter(
            card => card.rank.trickTakingRank === lowestRank
        )
        return lowestCards;
    }

    static highestCards(cards: Card[], topRank: Rank): Card[] {
        const highestRank = Math.max(...cards.map(card => rankTTWithRespectTo(card.rank, topRank)));
        const highestCards = cards.filter(
            card => rankTTWithRespectTo(card.rank, topRank) === highestRank
        )
        return highestCards;
    }

    static singleHighestCard(cards: Card[], topRank: Rank): Card {
        const highestCards = this.highestCards(cards, topRank);
        if (highestCards.length > 1) {
            // TODO: error
            console.log(`Too many highest cards: ${highestCards}`);
        }
        if (highestCards.length === 0) {
            // TODO: error
            console.log(`No highest cards: ${highestCards} from ${cards}`);
        }
        return highestCards[0];
    }
}

export const RANKS: Rank[] = [
    new Rank("2", 2, 14, 3, 2),
    ...Array.from({ length: 7 }, (_, i) => {
        const val = i + 3;
        return new Rank(String(val), val, val - 1, val + 1, val);
    }),
    new Rank("T", 10, 9, 11, 10),
    new Rank("J", 11, 10, 12, 12),
    new Rank("Q", 12, 11, 13, 15),
    new Rank("K", 13, 12, 14, 18),
    // Default rank above
    new Rank("A", 14, 13, 2, 1),
];

export const arbitraryTopRank = RANKS[RANKS.length - 1];

// TODO: named instead?
const suitsData = [
    { name: "Diamonds", html: "&diams;"},
    { name: "Hearts", html: "&hearts;"},
    { name: "Spades", html: "&spades;"},
    { name: "Clubs", html: "&clubs;"},
]

export function getSuits(): Suit[] {
    let suits = suitsData;
    return suits.map(
        (suitData, idx) => new Suit(suitData.name, idx, suitData.html)
    );
}

export const SUIT_NAMES = ['Diamonds', 'Hearts', 'Spades', 'Clubs'] as const;
export type suitName = typeof SUIT_NAMES[number];

export function getSuit(suitName: string): Suit {
    return getSuits().filter(suit => suit.toStringShort() === suitName)[0];
}

export const arbitrarySuit = getSuits()[0];
export const N_SUITS = getSuits().length;

export function getRank(shortName: string): Rank {
    return RANKS.filter(rank => rank.toStringShort() === shortName)[0];
}

export function getRankFromTTR(ttr: number): Rank {
    return RANKS.filter(rank => rank.trickTakingRank === ttr)[0];
}

export function getNextRankUp(rank: Rank): Rank {
    return getRankFromTTR(rank.ttRankAbove);
}

export function getNextRankDown(rank: Rank): Rank {
    return getRankFromTTR(rank.ttRankBelow);
}

export function getFullPack(): Card[] {
    const cards = [];
    const SUITS = getSuits();
    let index = 0;
    for (const rank of RANKS) {
        if (rank.name === "A") {
            rank.ttRankAbove = 2;
        }
        for (const suit of SUITS) {
            let card = new Card(suit, rank, index)
            cards.push(card);
            index++;
        }
    }
    return cards;
}

export function getCard(rank: Rank, suit: Suit): Card {
    const theCard = getFullPack().filter(
        card => Rank.rankEquals(card.rank, rank) && Suit.suitEquals(card.suit, suit)
    );
    // TODO length guard?
    return theCard[0];
}

export function getCardFromString(name: string): Card {
    const rank = name[0];
    const suit = name[1];
    return getCard(getRank(rank), getSuit(suit));
}

export function getNextCardUp(card: Card): Card {
    return getCard(getNextRankUp(card.rank), card.suit);
}

export function getNextCardDown(card: Card): Card {
    return getCard(getNextRankDown(card.rank), card.suit);
}

// suit doesn't matter here
export const packSize = getFullPack().length;

export function shuffle(cards: Card[]) {
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }
}
