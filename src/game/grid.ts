import { Card, getFullPack } from "./card";
import { Player } from "./player";

export class Grid {
    private cards: [Card, Player | null, boolean | null][];

    constructor() {
        const pack = getFullPack();
        this.cards = pack.map(card => [card, null, null]);
    }

    play(card: Card, player: Player): void {
        const cardArr = this.cards.filter(
            ([c, _p, _b]) => Card.cardEquals(c, card)
        )[0];
        if (cardArr[1] !== null) {
            throw Error(`Card already played! ${card}`)
        }
        cardArr[1] = player;
        cardArr[2] = true;  // face up at the point of playing
    }
}
