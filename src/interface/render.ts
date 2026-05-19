import { createCardElement } from './ui';
import { GameStateForUI, state } from '../game/gamestate';
import { PlayerName, playerNameArr } from '../game/player';
import { onHumanPlay } from './api';


export async function renderState(state: GameStateForUI) {
  // console.log(state);
  const handEl = document.getElementById('player-hand')!;
  const playerHand = state.hands.player;
  playerHand.sort(
    (c1, c2) => (
      // 100 big enough to ensure we always sort by suit first
      // TODO: align order with season
      100 * (c1.suit.rankForSorting - c2.suit.rankForSorting) +
      (c1.rank.trickTakingRank - c2.rank.trickTakingRank)
    )
  );
  handEl.innerHTML = '';
  playerHand.forEach(card => {
    handEl.appendChild(
      createCardElement(card.toStringShort(), state.whoseTurn === "player" ? (() => onHumanPlay(card)) : undefined)
    )
  });



  // game status - config
  document.getElementById('config')!.innerText = `playing to ${state.target}`;
  // and current status
  document.getElementById('hand-number')!.innerText = `(hand #${state.handNumber}, trick #${state.trickNumber})`;

  // document.getElementById('debug')!.innerText = `${state.gameState}`;

}

const delayMap: Record<state, number> = {
  game_initialise: 10,
  play_card: 700,
  trick_complete: 1700,
  hand_complete: 3000,
  new_hand: 10,
  game_complete: 10,
}

export async function renderWithDelays(states: GameStateForUI[]) {
  // console.log('rendering');
  for (const state of states) {
    // console.log('render')
    // console.log(state);
    await renderState(state);
    await wait(delayMap[state.gameState]);
  }
}


function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
