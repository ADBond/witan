import { Card } from "./card";
import { Player } from "./player";
import { GameConfig } from "./gamestate";
import { AgentName } from "./agent/agent";
import { getCommitHash } from "../utils/commit";

declare const __COMMIT_HASH__: string;

export class GameLog {
    private hands: Card[][] = [];

    private playerCount: number = 3;

    public dealerIndex: number = -1;
    public handNumber: number = -1;
    
    // each trick is array of trick value, [card, playerIndex], along with winner index + categories
    private tricks: [number, [Card, number][], number][] = [];

    public startingScores: number[] = [];
    public handScores: number[] = [];

    public complete: boolean = false;
    private version: string = getCommitHash();
    private logVersion: number = 1;
    private game: string = 'witan';

    constructor(
        private gameID: string,
        private config: GameConfig,
        private players: AgentName[],
    ) { }

    captureTrick(score: number, trick: [Card, Player][], winnerIndex: number) {
        this.tricks.push(
            [
                score,
                trick.map(([card, player]) => [card, player.positionIndex]),
                winnerIndex,
            ]
        );
    }

    captureHands(hands: Card[][]) {
        this.hands = hands.map(
            (hand) => hand.sort(
                (c1, c2) => (
                    // 100 big enough to ensure we always sort by suit first
                    // TODO: farm this out
                    100 * (c1.suit.rankForTrumpPreference - c2.suit.rankForTrumpPreference) +
                    (c1.rank.trickTakingRank - c2.rank.trickTakingRank)
                )
            )
        );
    }

    get finalScores(): number[] {
        return Array.from(
            this.startingScores,
            (_, i) => this.startingScores[i] + this.handScores[i]
        );
    }

    get json(): string {
        return JSON.stringify(this);
    }
}

// send game log to storage
export async function sendGameLog(log: GameLog) {
    console.log("Game Log:");
    console.log(log);
    // TODO: restore once game is all put together
    // try {
    //     const res = await fetch("https://qaw-games.netlify.app/.netlify/functions/saveGameLog", {
    //         method: "POST",
    //         headers: { "Content-Type": "application/json" },
    //         body: JSON.stringify(log),
    //     });

    //     if (!res.ok) {
    //         console.warn("Game log upload failed:", res.status, await res.text());
    //         return;
    //     }
    //     3.
    //     const json = await res.json();
    //     console.log("Log saved:", json);
    // } catch (err) {
    //     console.warn("Could not send game log (offline?):", err);
    // }
}
