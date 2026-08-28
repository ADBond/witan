import { createCardElement, createSuitElement } from './ui';
import { GameStateForUI, state } from '../game/gamestate';
import { PlayerName, playerNameArr, TeamName } from '../game/player';
import { renderGrid } from './grid';
import { onHumanPlay } from './api';


function displayNameTeam(team: TeamName, numPlayers: number): string {
  switch (team) {
    case 'player':
      return 'Player';
    case 'comp1':
      return numPlayers === 3 ? 'West' : 'W';
    case 'comp2':
      return numPlayers === 3 ? 'East' : 'NW';
  }
}

export async function renderState(state: GameStateForUI) {
  // console.log(state);
  const handEl = document.getElementById('player-hand')!;
  const playerHand = state.hands.player;
  playerHand.sort(
    (c1, c2) => (
      // 100 big enough to ensure we always sort by suit first
      100 * (c1.suit.rankForSorting - c2.suit.rankForSorting) +
      (c1.rank.trickTakingRank - c2.rank.trickTakingRank)
    )
  );
  renderGrid(state.grid);
  handEl.innerHTML = '';
  playerHand.forEach(card => {
    handEl.appendChild(
      createCardElement(
        card.toStringShort(),
        state.whoseTurn === "player" ? (() => onHumanPlay(card)) : undefined,
        state.legalCardIndices.includes(card.index),
      )
    )
  });

  const trumpEl = document.getElementById('trumps')!;
  trumpEl.innerHTML = '';
  trumpEl.appendChild(createSuitElement(state.grid.trumpSuit.toStringShort()));

  // game status - config
  document.getElementById('config')!.innerText = `playing to ${state.target}`;
  // and current status
  document.getElementById('hand-number')!.innerText = `(hand #${state.handNumber}, trick #${state.trickNumber})`;

  // document.getElementById('debug')!.innerText = `${state.gameState}`;
  const namesHolder = document.getElementById('scores-headers')!;
  const currentScoresHolder = document.getElementById('scores-current')!;
  const prevScoresHolder = document.getElementById('scores-previous')!;
  namesHolder.innerHTML = '';
  currentScoresHolder.innerHTML = '';
  prevScoresHolder.innerHTML = '';
  state.teamNames.forEach(
    (teamName) => {
      const headerEl = document.createElement('th');
      headerEl.innerText = displayNameTeam(teamName, state.playerNames.length);
      namesHolder.appendChild(headerEl);
      const teamScoreEl = document.createElement('td');
      teamScoreEl.id = `score-${teamName}`;
      teamScoreEl.innerText = `${state.scores[teamName]!}`;
      currentScoresHolder.appendChild(teamScoreEl);

      const prevScoreEl = document.createElement('td');
      prevScoreEl.id = `score-player-${teamName}`;
      // TODO: need to translate to team prev instead for this
      prevScoreEl.innerText = `(${state.scoresPrev[teamName]!})`;
      prevScoresHolder.appendChild(prevScoreEl);
    }
  )
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
