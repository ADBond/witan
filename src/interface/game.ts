import { AgentName } from "../game/agent/agent";
import { Game } from "../game/game";
import { defaultConfig } from "../game/game";
import { GameConfig } from "../game/gamestate";

let game: Game;
// const opp = 'random';
const opp = 'ismcts100'

export function newGame(config: GameConfig): void {
    const playerNames: AgentName[] = ['human', ...Array(config.numPlayers - 1).fill(opp)];
    game = new Game(
        playerNames,
        defaultConfig,
    );
}

export function getGame(): Game {
    if (!game) console.log("Error getting game! None found!");
    return game;
}
