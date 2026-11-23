// main.js — boots Emberfall, moves between the title, table and end
// screens, and runs the turn loop: the player's clicks, then the Warden's
// planned turn played back card by card so every blow can be watched.

import { makeRng } from './random.js';
import { createGame, playCardByUid, endTurn } from './engine.js';
import { chooseIntent, planWardenTurn } from './ai.js';
import { render } from './render.js';
import { playEvents, confettiBurst } from './anim.js';
import { shotKind, buildShotState } from './shots.js';

const ui = { busy: false, lastPlayed: null, onPlayCard: null };
let state = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function showScreen(name) {
  for (const id of ['title', 'table', 'end']) {
    document.getElementById('screen-' + id).classList.toggle('hidden', id !== name);
  }
}

function fillEndScreen() {
  const won = state.winner === 'player';
  document.getElementById('end-title').textContent = won ? 'VICTORY' : 'DEFEAT';
  document.getElementById('end-title').className = won ? 'end-win' : 'end-loss';
  document.getElementById('end-sub').textContent = won
    ? 'The Ashen Warden crumbles to cinders. Your spark burns on.'
    : 'Your spark fades to ash — but embers remember. Duel again?';
  document.getElementById('end-stats').textContent =
    `Turns fought: ${state.turn} · Your life: ${state.player.life} · Warden's life: ${state.warden.life}`;
}

function finishGame() {
  setTimeout(() => {
    showScreen('end');
    fillEndScreen();
    if (state.winner === 'player') confettiBurst(document.getElementById('confetti'));
  }, 950);
}

function onPlayCard(uid) {
  if (!state || ui.busy || state.active !== 'player') return;
  const events = playCardByUid(state, 'player', uid);
  if (!events) return;
  const played = events.find((e) => e.t === 'play');
  if (played) ui.lastPlayed = { card: played.card, kindled: played.kindled };
  render(state, ui);
  playEvents(events);
  if (state.winner) finishGame();
}

async function onEndTurn() {
  if (!state || ui.busy || state.active !== 'player' || state.winner) return;
  ui.busy = true;
  endTurn(state); // opens the Warden's turn: ember grows, it draws
  render(state, ui);
  await sleep(550);
  const plan = planWardenTurn(state);
  for (const uid of plan) {
    const events = playCardByUid(state, 'warden', uid);
    if (!events) continue;
    const played = events.find((e) => e.t === 'play');
    if (played) ui.lastPlayed = { card: played.card, kindled: played.kindled };
    render(state, ui);
    playEvents(events);
    if (state.winner) break;
    await sleep(760);
  }
  if (state.winner) {
    ui.busy = false;
    finishGame();
    return;
  }
  state.warden.intent = chooseIntent(state); // it commits to its next play
  endTurn(state); // back to the player
  ui.busy = false;
  render(state, ui);
}

function newGame() {
  state = createGame(makeRng(Date.now() % 2147483647));
  state.warden.intent = chooseIntent(state);
  ui.lastPlayed = null;
  ui.busy = false;
  showScreen('table');
  const table = document.getElementById('screen-table');
  table.classList.add('deal-in');
  setTimeout(() => table.classList.remove('deal-in'), 1100);
  render(state, ui);
}

ui.onPlayCard = onPlayCard;
document.getElementById('btn-start').addEventListener('click', newGame);
document.getElementById('btn-again').addEventListener('click', newGame);
document.getElementById('btn-end').addEventListener('click', onEndTurn);

// Screenshot set-ups (?shot=…) skip the title and deal a fixed state.
const kind = shotKind();
if (kind === 'title') {
  document.body.classList.add('still');
} else if (kind) {
  const shot = buildShotState(kind);
  state = shot.state;
  ui.lastPlayed = shot.lastPlayed;
  ui.busy = true;
  document.body.classList.add('still');
  if (kind === 'duel') {
    showScreen('table');
    render(state, ui);
  } else {
    showScreen('end');
    fillEndScreen();
    if (kind === 'win') confettiBurst(document.getElementById('confetti'));
  }
}
