import { GameState } from "../gamestate";
import { randomAgent } from "./random";
import { ismctsAgent } from "./ismcts/agent";

export interface ComputerAgent {
    chooseMove: (gameState: GameState, legalMoveIndices: number[]) => Promise<number>
}

export type Agent = ComputerAgent | 'human';
export type AgentName = 'human' | 'random' | 'ismcts50' | 'ismcts100';

export function agentLookup(name: AgentName): Agent {
    if (name === 'human') {
        return name;
    } else if (name === 'random') {
        return randomAgent;
    } else if (name === 'ismcts50') {
        return ismctsAgent(50, randomAgent);
    } else if (name === 'ismcts100') {
        return ismctsAgent(100, randomAgent);
    }
    throw Error(`Unknown model ${name}`);
}
