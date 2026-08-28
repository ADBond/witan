import { Card, Suit, getCardFromString, getFullPack, shuffle } from "./card";
import { Player, PlayerName, TeamName, playerNameArr } from "./player";
import { Grid } from "./grid";
import { Agent, AgentName, agentLookup } from "./agent/agent";
import { GameLog } from "./log";

export type GameConfig = {
    targetScore: number,
}

function copyConfig(config: GameConfig): GameConfig {
    return {targetScore: config.targetScore};
}

export type state = 'game_initialise' | 'play_card' | 'trick_complete' | 'hand_complete' | 'new_hand' | 'game_complete';

export class GameState {
    public dealerIndex: number;
    public currentPlayerIndex: number;
    public leaderIndex: number | null = null;
    public pack: Card[];

    public players: Player[] = [];
    public trickIndex: number;
    // public trickInProgress: [Card, Player][] = [];
    // public playedCards: Card[] = [];
    public grid: Grid = new Grid();

    public handNumber: number = 0;
    public currentState: state = 'game_initialise';

    public previousTrick: [Card, Player][] = [];

    constructor(public playerNames: AgentName[], public config: GameConfig) {
        // TODO: more / flexi ??
        const playerConfig: PlayerName[] = ['player', 'comp1', 'comp2'];
        const agents: Agent[] = playerNames.map((name) => agentLookup(name));
        this.players = playerNames.map(
            (name, i) => new Player(
                name,
                playerConfig[i],
                agents[i],
                i,
            )
        )
        // choose a random initial dealer
        this.dealerIndex = Math.floor(Math.random() * playerNames.length);
        // dummy values:
        this.currentPlayerIndex = 0;
        this.trickIndex = 0;
        this.pack = getFullPack();
    }

    public clone(): GameState {
        // make a (deep) copy - at least of the things we care about
        const newConfig = copyConfig(this.config);
        const playerNames = [...this.playerNames];
        const newState = new GameState(playerNames, newConfig);

        // copy remaining state
        newState.dealerIndex = this.dealerIndex;
        newState.currentPlayerIndex = this.currentPlayerIndex;
        newState.leaderIndex = this.leaderIndex;
        newState.pack = [...this.pack];

        newState.players = this.players.map(player => player.clone());
        newState.trickIndex = this.trickIndex;
        // TODO: does it matter that these players are different to the ones in player array?
        // newState.trickInProgress = this.trickInProgress.map(
        //     ([card, player]) => [card, player.clone()]
        // );
        // newState.playedCards = [...this.playedCards];
        newState.grid = this.grid.clone();
    
        newState.handNumber = this.handNumber;
        newState.currentState = this.currentState;

        newState.previousTrick = this.previousTrick.map(
            ([card, player]) => [card, player.clone()]
        );

        return newState;
    }

    public async increment(log: GameLog | null = null) {
        const state = this.currentState;
        // console.log(`Incrementing state - currently: ${state}`);
        switch (state) {
            case 'game_initialise':
                this.dealCards(log);
                break;
            case 'play_card':
                const _moveIndex = await this.computerMove();
                break;
            case 'trick_complete':
                this.resetTrick(log);
                break;
            case 'hand_complete':
                this.dealerIndex = this.getNextPlayerIndex(this.dealerIndex);

                if (log !== null) {
                    this.completeLog(log);
                }
                // initialise as separate state - keeps from doing too much at once
                this.currentState = 'game_initialise';
                break;
            case 'game_complete':
                if (log !== null) {
                    this.completeLog(log);
                }
                break;
            default:
            // error!
        }
    }

    get cardsPerHand(): number {
        return 13;
    }

    get trickNumber(): number {
        return this.trickIndex + 1;
    }

    get trickInProgress(): [Card, Player][] {
        return this.grid.currentTrick;
    }

    get trickInProgressCards(): Card[] {
        return this.trickInProgress.map(
            ([card, _player]) => card
        );
    }

    get tableCards(): Card[] {
        return this.grid.allCards.filter(
            gridEntry => gridEntry.data !== null
        ).map(
            gridEntry => gridEntry.card
        );
    }

    get currentLedSuit(): Suit | null {
        const trickInProgressCards = this.trickInProgressCards;
        if (trickInProgressCards.length === 0) {
            return null;
        }
        return trickInProgressCards[0].suit;
    }

    get legalMoveIndices(): number[] {
        let legalCards: Card[];
        const hand = this.currentPlayerHand;
        const ledSuit = this.currentLedSuit;
        if (ledSuit === null) {
            // if there is no card led, anything is legal
            legalCards = hand;
        } else {
            // must follow suit if we can
            legalCards = hand.filter(card => Suit.suitEquals(card.suit, ledSuit));
            if (legalCards.length === 0) {
                // if we have no cards of led suit, anything is legal
                legalCards = hand;
            } else {
                // if we have cards of suit led, we can also play adjoining cards
                const adjoiningInHand = hand.filter(
                    card => this.grid.adjoiningCards.map(card => card.index).includes(card.index)
                );
                legalCards.push(
                    ...adjoiningInHand
                );
            }
        }
        return legalCards.map(card => card.index);
    }

    getPlayer(name: PlayerName): Player {
        return this.players.filter(
            (player) => player.name === name
        )[0];
    }


    getPlayerTeam(playerName: PlayerName): TeamName {
        switch (playerName) {
            case 'player':
                switch (this.numPlayers) {
                    case 3:
                        return 'player';
                    default:
                        throw Error(`Unsupported player count: ${this.numPlayers}`);
                }
                break;
            case 'comp1':
                switch (this.numPlayers) {
                    case 3:
                        return 'comp1';
                    default:
                        throw Error(`Unsupported player count: ${this.numPlayers}`);
                }
                break;
            case 'comp2':
                switch (this.numPlayers) {
                    case 3:
                        return 'comp2';
                    default:
                        throw Error(`Unsupported player count: ${this.numPlayers}`);
                }
                break;
        }
    }

    getTeamPlayers(teamName: TeamName): Player[] {
        return this.players.filter(
        player => this.getPlayerTeam(player.name) === teamName
        );
    }

    getTeamScore(teamName: TeamName): number {
        return this.getTeamPlayers(teamName).map(p => p.score).reduce((total, value) => total + value, 0);
    }

    get prevTrickScores(): number[] {
        return this.players.map(player => player.previousScore);
    }

    get scores(): number[] {
        return this.players.map(player => player.score);
    }

    private getPlayedCard(name: PlayerName, trick: [Card | null, Player][]): Card | null {
        const playerPlayedCards = trick.filter(
            ([_card, player]) => player.name === name
        );
        const numCards = playerPlayedCards.length;
        if (numCards === 1) {
            return playerPlayedCards[0][0];
        }
        if (numCards > 1) {
            console.log(`getPlayedCard error: ${playerPlayedCards}`);
        }
        return null;
    }

    get played(): Record<PlayerName, Card | null | 'back'> {
        let played;
        played = Object.fromEntries(
            playerNameArr.map((name): [PlayerName, Card | null | 'back'] => [
                name, this.getPlayedCard(name, this.trickInProgress)
            ])
        ) as Record<PlayerName, Card | 'back' | null>;

        return played;
    }

    get currentPlayer(): Player {
        return this.players[this.currentPlayerIndex];
    }

    get currentPlayerHand(): Card[] {
        return this.currentPlayer.hand;
    }

    get humanHand(): Card[] {
        // TODO: don't fix index of human player, maybe?
        return this.getPlayerHand(0);
    }

    get numPlayers(): number {
        return this.players.length;
    }

    get names(): PlayerName[] {
        return this.players.map(player => player.name);
    }

    get teamNames(): TeamName[] {
        switch (this.numPlayers) {
        case 3:
            return ['player', 'comp1', 'comp2'];
        default:
            throw Error(`Unsupported player count: ${this.numPlayers}`);
        } 
    }

    getNextPlayerIndex(playerIndex: number): number {
        return ((playerIndex + 1) % this.numPlayers);
    }

    public trickWinnerPlayer(): Player {
        const winningCardPlay = this.trickInProgress.filter(
            ([card, player]) => Card.cardEquals(card, this.winningCard(this.grid.trumpSuit))
        );
        // TODO: length check?
        const trickWinner = winningCardPlay[0][1];
        return trickWinner;
    }

    public winningCard(trumpSuit: Suit): Card {
        // straight from Scalade
        const trumpCardsPlayed = this.trickInProgress.filter(
            ([card, _player]) => Suit.suitEquals(card.suit, trumpSuit)
        );
        let winningCard: Card;
        const topRank = this.grid.topRank;
        if (trumpCardsPlayed.length > 0) {
            winningCard = Card.singleHighestCard(trumpCardsPlayed.map(([card, _player]) => card), topRank);
        } else {
            const ledCardsPlayed = this.trickInProgress.filter(
                ([card, _player]) => Suit.suitEquals(card.suit, this.currentLedSuit as Suit)
            );
            winningCard = Card.singleHighestCard(ledCardsPlayed.map(([card, _player]) => card), topRank)
        }
        return winningCard;
    }

    get handNotFinished(): boolean {
        return this.players.map(
            (player) => player.hand
        ).some(
            (hand) => hand.length > 0
        );
    }

    public moveFromIndex(cardToPlayIndex: number): number {
        const cardToPlay = Card.cardFromIndex(cardToPlayIndex, this.pack)

        if (!this.playCard(cardToPlay)) {
            console.log("Error playing card");
        }
        return cardToPlayIndex;
    }

    private async computerMove(): Promise<number> {
        const agent = this.currentPlayer.agent;
        if (agent === 'human') {
            // TODO: error
            console.log("Error: trying to move for a human")
            return -20;
        }
        if (this.currentState !== 'play_card') {
            // TODO: error
            console.log(`Error: can't play card in ${this.currentState}`)
            return -20;
        }

        const currentLegalMoves = this.legalMoveIndices;
        const cardToPlayIndex = await agent.chooseMove(this, currentLegalMoves);
        return this.moveFromIndex(cardToPlayIndex);
    }

    giveCardToPlayer(playerIndex: number, card: Card) {
        this.players[playerIndex].hand.push(card);
    }

    getPlayerHand(playerIndex: number): Card[] {
        return this.players[playerIndex].hand ?? [];
    }

    playCard(card: Card): boolean {
        if (!this.legalMoveIndices.includes(card.index)) {
            console.log(`Error: Cannot play illegal card ${card}`);
            return false;
        }
        const player = this.currentPlayer;
        const hand = player.hand;
        if (!hand) {
            console.log("Error: I couldn't find a hand!");
            return false;
        }

        const index = hand.findIndex(
            c =>  Card.cardEquals(c, card)
        );
        if (index < 0) {
            console.log("Couldn't find card in hand!");
            console.log(`Card: ${card} in hand ${hand}`);
            return false;
        }
        const [playedCard] = hand.splice(index, 1);
        this.grid.play(playedCard, player, this.trickInProgress.length + 1);
        // TODO: think we can just leave it all in the grid!
        // this.trickInProgress.push([playedCard, player]);
        // this.playedCards.push(playedCard);

        if (this.trickInProgress.length === this.numPlayers) {
            this.currentState = "trick_complete";
            return true;
        }
        const newCurrentPlayerIndex = this.getNextPlayerIndex(this.currentPlayerIndex);
        this.currentPlayerIndex = newCurrentPlayerIndex;
        return true;
    }

    // TODO: seed?
    dealCards(log: GameLog | null): void {
        const pack = getFullPack();
        const tableCardStrings = [
            "5C", "6C", "7C", "8C",
            "8S", "9S", "TS", "JS",
            "8H", "9H",
            "7D", "8D", "9D",
        ];
        const tableCards = tableCardStrings.map(cardString => getCardFromString(cardString))
        const toDeal = pack.filter(card => !tableCards.some(tableCard => Card.cardEquals(card, tableCard)));
        // TODO: filter out table cards
        // TODO: set up table cards, probably before this.
        this.grid = new Grid();  // TODO: something else?
        // for now just a fixed grid from a deal the other day
        this.grid.addNeutralsToGrid(tableCards);
        shuffle(toDeal);
        for (let i = 0; i < 13; i++) {
            // for (const player of this.state.players) {
            // TODO: loop this properly!
            for (let playerIndex = 0; playerIndex < this.numPlayers; playerIndex++) {
                const card = toDeal.pop();
                if (card) this.giveCardToPlayer(playerIndex, card);
            }
        }
        if (toDeal.length > 0) {
            throw Error(`Remaining cards! ${toDeal.join(', ')}`)
        }

        this.currentState = 'play_card';
        this.currentPlayerIndex = this.getNextPlayerIndex(this.dealerIndex);
        this.handNumber++;
        this.trickIndex = 0;
        // this.playedCards = [];

        if (log !== null) {
            // and update the current log
            log.dealerIndex = this.dealerIndex;
            log.handNumber = this.handNumber;
            log.captureHands(this.players.map((player) => [...this.getPlayerHand(player.positionIndex)]));
            log.startingScores = this.players.map((player) => player.score);
        }
    }

    resetTrick(log: GameLog | null): void {
        // TODO: would be nice if we could represent this as a separate state for UI
        this.grid.resolveTrick();
        const winnerPlayer = this.trickWinnerPlayer();
        const winnerPlayerIndex = winnerPlayer.positionIndex;
        this.currentPlayerIndex = winnerPlayerIndex;
        const trickValue = this.updateScores(winnerPlayerIndex);

        if (log !== null) {
            log.captureTrick(
                trickValue,
                this.trickInProgress,
                winnerPlayer.positionIndex,
            );
        }

        if (this.gameIsFinished) {
            this.currentState = "game_complete";
            return;
        }

        this.previousTrick = this.trickInProgress;

        // empty the trick, and increment the counter!
        this.grid.resetTrick();
        this.trickIndex++;
        if (this.handNotFinished) {
            this.currentState = "play_card";
        } else {
            this.currentState = "hand_complete";
        }
    }

    updateScores(winnerPlayerIndex: number): number {

        const trickValue = this.grid.currentTrickEntries.filter(
            gridEntry => gridEntry.data!.trick!.touchingGrid
        ).map(
            gridEntry => gridEntry.card.rank.count_value
        ).reduce(
            (x, y) => x + y, 0
        );
        // update the scores
        this.players[winnerPlayerIndex].scores.push(trickValue);
        // other players explicitly score 0 !
        this.players[(winnerPlayerIndex + 1) % this.numPlayers].scores.push(0);
        this.players[(winnerPlayerIndex + 2) % this.numPlayers].scores.push(0);

        return trickValue;
    }

    get gameIsFinished(): boolean {
        return this.players.map(
            (player) => player.score
        ).some((score) => score >= this.config.targetScore)
    }

    completeLog(log: GameLog) {
        log.handScores = this.scores;
        log.complete = true;
    }

    getStateForUI(): GameStateForUI {
        return ({
            hands: { comp1: [], player: this.currentState === "hand_complete" ? [] : this.humanHand.slice(), comp2: [] },

            playerNames: this.names,
            teamNames: this.teamNames,

            legalCardIndices: this.legalMoveIndices,
            grid: this.grid.clone(),

            scores: Object.fromEntries(
                this.teamNames.map(
                    (teamName): [TeamName, number] => {
                        return [
                        teamName,
                        this.getTeamScore(teamName),
                        ]
                    }
                )
            ),
            scoresPrev: Object.fromEntries(
                this.teamNames.map(
                    (teamName): [TeamName, number] => {
                        return [
                        teamName,
                        this.getTeamPlayers(teamName).map(
                            p => p.previousScore
                        ).reduce(
                            (total, value) => total + value, 0
                        ),
                        ]
                    }
                )
            ),

            gameState: this.currentState,
            whoseTurn: this.currentPlayer.name,
            dealer: this.players[this.dealerIndex].name,
            handNumber: this.handNumber,
            trickNumber: this.trickNumber,
            target: this.config.targetScore,
        })
    }
}

export interface GameStateForUI {
    hands: Record<PlayerName, Card[]>;
    legalCardIndices: number[],
    grid: Grid,

    playerNames: PlayerName[];
    teamNames: TeamName[];

    scores: Partial<Record<TeamName, number>>;
    scoresPrev: Partial<Record<TeamName, number>>;

    handNumber: number;
    trickNumber: number;
    target: number;

    gameState: state;
    whoseTurn: PlayerName;
    dealer: PlayerName;

}
