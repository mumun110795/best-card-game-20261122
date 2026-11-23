// shots.js — deterministic set-ups for the screenshots in /screenshots.
// Opening the game with ?shot=duel (or win, or loss) builds a real game
// state with a fixed seed and deals it into a photogenic moment — a
// mid-duel table, the victory screen, the defeat screen — using the same
// engine and renderer as live play. ?shot=title shows the title screen.

import { makeRng } from './random.js';
import { createGame } from './engine.js';
import { cardById } from './cards.js';
import { intentOfCard } from './ai.js';

let shotUid = 9000;
function inst(id) {
  return { uid: shotUid++, card: cardById(id) };
}

export function shotKind() {
  return new URLSearchParams(location.search).get('shot');
}

export function buildShotState(kind) {
  const params = new URLSearchParams(location.search);
  const seed = Number(params.get('seed') || 7);
  const state = createGame(makeRng(seed));
  let lastPlayed = null;

  if (kind === 'duel') {
    state.turn = 5;
    state.player.life = 14;
    state.player.guard = 4;
    state.player.emberMax = 5;
    state.player.ember = 3;
    state.player.lastSuit = 'flame';
    state.player.hand = ['pyre-blast', 'spark-jab', 'briar-guard', 'siphon', 'spring-tide'].map(inst);
    state.player.deck = state.player.deck.slice(0, 11);
    state.player.discard = ['ember-lance', 'cool-draught'].map(inst);

    state.warden.life = 13;
    state.warden.guard = 6;
    state.warden.emberMax = 5;
    state.warden.ember = 5;
    state.warden.hand = ['night-drain', 'hedge-wall', 'spark-jab', 'grave-ember'].map(inst);
    state.warden.deck = state.warden.deck.slice(0, 13);
    state.warden.discard = ['thorn-lash'].map(inst);
    state.warden.intent = { ...intentOfCard(cardById('pyre-blast'), state.player, false), uid: 0 };
    state.log = [
      'The Ashen Warden played Thorn Lash (kindled).',
      'You, the Sparkbearer played Ember Lance.',
      'The Ashen Warden played Ember Lance (kindled).',
    ];
    lastPlayed = { card: cardById('ember-lance'), kindled: true };
  }

  if (kind === 'win') {
    state.turn = 8;
    state.winner = 'player';
    state.player.life = 9;
    state.warden.life = 0;
    lastPlayed = { card: cardById('doom-herald'), kindled: true };
  }

  if (kind === 'loss') {
    state.turn = 7;
    state.winner = 'warden';
    state.player.life = 0;
    state.warden.life = 6;
    lastPlayed = { card: cardById('pyre-blast'), kindled: false };
  }

  return { state, lastPlayed };
}
