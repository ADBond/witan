import { Game } from "../game/game";
import { defaultConfig } from "../game/game";

let game: Game;
const opp = 'random';

export function newGame(): void {
    game = new Game(
        ['human', opp, opp],
        defaultConfig,
    );
}

export function getGame(): Game {
    if (!game) console.log("Error getting game! None found!");
    return game;
}
