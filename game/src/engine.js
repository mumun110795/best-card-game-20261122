// engine.js — the rules of Emberfall, with no knowledge of the browser.
// It owns the game state (two duelists, their life, guard, ember, decks and
// hands), resolves every card, and reports what happened as a list of
// events so the page can animate them. Both the page and the headless
// play-tests drive the game through these same functions.

import { buildDeck, drawCards, findInHand } from './deck.js';

export const MAX_LIFE = 20;
export const MAX_GUARD = 12;
export const MAX_EMBER_MAX = 8;

function makeDuelist(name) {
  return {
    name,
    life: MAX_LIFE,
    maxLife: MAX_LIFE,
    guard: 0,
    emberMax: 1,
    ember: 1,
    bramble: 0, // damage bounced back at foes who strike this guard
    deck: [],
    hand: [],
    discard: [],
    lastSuit: null, // suit of the last card played this turn (for Kindled)
    turnsTaken: 0,
  };
}

export function createGame(rng) {
  const state = {
    rng,
    handLimit: 8,
    turn: 1,
    active: 'player',
    winner: null,
    player: makeDuelist('You, the Sparkbearer'),
    warden: makeDuelist('The Ashen Warden'),
    log: [],
  };
  // The Warden is hardier than the challenger: it stands second in every
  // exchange, so it starts with 22 life to the player's 20.
  state.warden.life = 22;
  state.warden.maxLife = 22;
  state.player.deck = buildDeck(rng);
  state.warden.deck = buildDeck(rng);
  drawCards(state, state.player, 5);
  drawCards(state, state.warden, 4);
  state.player.turnsTaken = 1;
  return state;
}

export function other(state, who) {
  return who === 'player' ? 'warden' : 'player';
}

function duelist(state, who) {
  return state[who];
}

function logLine(state, line) {
  state.log.push(line);
  if (state.log.length > 40) state.log.shift();
}

// Start a duelist's turn: their ember pool grows and refills, their own
// bramble fades, and they draw two cards.
export function startTurn(state, who) {
  const me = duelist(state, who);
  state.active = who;
  me.turnsTaken++;
  if (me.turnsTaken > 1) me.emberMax = Math.min(MAX_EMBER_MAX, me.emberMax + 1);
  me.ember = me.emberMax;
  me.bramble = 0;
  me.lastSuit = null;
  const drawn = drawCards(state, me, 2);
  const events = [{ t: 'turn', who, turn: state.turn }];
  if (drawn > 0) events.push({ t: 'draw', who, n: drawn });
  return events;
}

// Deal damage from one duelist to the other. Guard soaks first unless the
// hit slips past it. Bramble bites back once per hit that guard absorbed.
// Returns the events describing the hit.
export function dealDamage(state, fromWho, toWho, amount, opts = {}) {
  const foe = duelist(state, toWho);
  const me = duelist(state, fromWho);
  const events = [];
  if (amount <= 0 || state.winner) return events;
  let absorbed = 0;
  if (!opts.ignoreGuard && foe.guard > 0) {
    absorbed = Math.min(foe.guard, amount);
    foe.guard -= absorbed;
  }
  const lifeLost = amount - absorbed;
  foe.life = Math.max(0, foe.life - lifeLost);
  events.push({ t: 'damage', who: toWho, amount, absorbed, lifeLost });
  if (absorbed > 0 && foe.bramble > 0 && !opts.fromBramble) {
    events.push(...dealDamage(state, toWho, fromWho, foe.bramble, { fromBramble: true }));
  }
  if (foe.life <= 0 && !state.winner) {
    state.winner = fromWho;
    events.push({ t: 'win', who: fromWho });
  }
  return events;
}

export function healLife(state, who, amount) {
  const me = duelist(state, who);
  const healed = Math.min(amount, me.maxLife - me.life);
  me.life += healed;
  return healed > 0 ? [{ t: 'heal', who, amount: healed }] : [];
}

export function gainGuard(state, who, amount) {
  const me = duelist(state, who);
  const gained = Math.min(amount, MAX_GUARD - me.guard);
  me.guard += gained;
  return gained > 0 ? [{ t: 'guard', who, amount: gained }] : [];
}

// Merge a card's base effects with its Kindled bonus (same keys add up).
function mergedFx(card, kindled) {
  const fx = { ...card.fx };
  if (kindled && card.kindledFx) {
    for (const [key, value] of Object.entries(card.kindledFx)) {
      fx[key] = (fx[key] || 0) + (typeof value === 'number' ? value : 0);
      if (typeof value === 'boolean') fx[key] = value;
    }
  }
  return fx;
}

// The damage a card would deal with its first hit right now (used for the
// Warden's telegraphed intent and by the AI's planning).
export function firstHitDamage(card, foe, kindled) {
  const fx = mergedFx(card, kindled);
  let dmg = fx.damage || 0;
  if (fx.executeBelow !== undefined && foe.life <= fx.executeBelow) dmg = fx.executeDamage;
  if (fx.bonusIfUnguarded && foe.guard === 0) dmg += fx.bonusIfUnguarded;
  return dmg;
}

// Play the card with this uid from a duelist's hand. Returns null when the
// play is not legal (not their turn, card missing, not enough ember);
// otherwise the events it caused.
export function playCardByUid(state, who, uid) {
  if (state.winner || state.active !== who) return null;
  const me = duelist(state, who);
  const foe = duelist(state, other(state, who));
  const index = findInHand(me, uid);
  if (index < 0) return null;
  const inst = me.hand[index];
  const card = inst.card;
  if (card.cost > me.ember) return null;

  const kindled = me.lastSuit !== null && me.lastSuit === card.suit;
  me.ember -= card.cost;
  me.hand.splice(index, 1);
  me.discard.push(inst);
  me.lastSuit = card.suit;

  const fx = mergedFx(card, kindled);
  const events = [{ t: 'play', who, card, kindled }];

  if (fx.guard) events.push(...gainGuard(state, who, fx.guard));
  if (fx.bramble) {
    me.bramble = Math.max(me.bramble, fx.bramble);
    events.push({ t: 'bramble', who, amount: fx.bramble });
  }
  if (fx.heal) events.push(...healLife(state, who, fx.heal));
  if (fx.ember) {
    me.ember += fx.ember;
    events.push({ t: 'ember', who, amount: fx.ember });
  }
  if (fx.draw) {
    const drawn = drawCards(state, me, fx.draw);
    if (drawn > 0) events.push({ t: 'draw', who, n: drawn });
  }
  if (fx.damage) {
    let dmg = fx.damage;
    if (fx.executeBelow !== undefined && foe.life <= fx.executeBelow) dmg = fx.executeDamage;
    if (fx.bonusIfUnguarded && foe.guard === 0) dmg += fx.bonusIfUnguarded;
    events.push(...dealDamage(state, who, other(state, who), dmg));
  }
  if (fx.damage2 && !state.winner) {
    events.push(...dealDamage(state, who, other(state, who), fx.damage2, { ignoreGuard: !!fx.ignoreGuard2 }));
  }

  logLine(state, `${me.name} played ${card.name}${kindled ? ' (kindled)' : ''}.`);
  return events;
}

// End the active duelist's turn and open the other's.
export function endTurn(state) {
  if (state.winner) return [];
  const next = other(state, state.active);
  if (next === 'player') state.turn++;
  return startTurn(state, next);
}
