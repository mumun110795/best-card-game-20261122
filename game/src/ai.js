// ai.js — the Ashen Warden's brain. It plays by two habits the player can
// learn to read:
//   1. It telegraphs. At the end of its turn it commits to the biggest play
//      it expects to afford next turn, and that intent is shown to the
//      player for the whole of the player's turn — raise Guard against a
//      Strike, out-race a Ward, answer a Leech with one of your own.
//   2. It schemes first. On its turn it plays draw and ember cards before
//      anything else, then its promised intent card, then whatever else it
//      can afford, healing when it is close to death.

import { firstHitDamage, playCardByUid } from './engine.js';

// What kind of threat a card poses, for the intent banner.
export function intentOfCard(card, foe, kindled) {
  const fx = { ...card.fx };
  if (fx.damage) {
    const dmg = firstHitDamage(card, foe, kindled) + (fx.damage2 || 0);
    return fx.heal
      ? { kind: 'leech', amount: dmg, card }
      : { kind: 'strike', amount: dmg, card };
  }
  if (fx.guard) return { kind: 'ward', amount: fx.guard + (fx.heal || 0), card };
  if (fx.heal) return { kind: 'mend', amount: fx.heal, card };
  return { kind: 'scheme', amount: fx.draw || fx.ember || 0, card };
}

function affordableNextTurn(state, duelist) {
  return Math.min(8, duelist.emberMax + 1);
}

// Choose the Warden's intent for its next turn: the strongest card in its
// hand it will be able to afford, judged against the player as they stand.
export function chooseIntent(state) {
  const warden = state.warden;
  const budget = affordableNextTurn(state, warden);
  let best = null;
  for (const inst of warden.hand) {
    if (inst.card.cost > budget) continue;
    const intent = intentOfCard(inst.card, state.player, false);
    const score = intent.amount * (intent.kind === 'scheme' ? 0.6 : 1);
    if (!best || score > best.score) best = { ...intent, uid: inst.uid, score };
  }
  return best;
}

function cloneState(state) {
  return structuredClone({ ...state, rng: { ...state.rng } });
}

// Plan the Warden's whole turn on a cloned state (the clone spends the
// same shuffled draws the real turn will, so the plan stays honest) and
// return the card uids to play, in order.
export function planWardenTurn(state) {
  const sim = cloneState(state);
  const order = [];
  const intentUid = state.warden.intent ? state.warden.intent.uid : null;

  const category = (inst) => {
    const fx = inst.card.fx;
    if (fx.draw || fx.ember) return 0; // scheme first: it extends the turn
    if (inst.uid === intentUid) return 1; // then the promised card
    if (fx.damage && sim.warden.life <= 9 && fx.heal) return 2; // leech to live
    if (fx.damage) return 3;
    if (fx.heal && sim.warden.life <= 10) return 4;
    if (fx.guard) return 5;
    if (fx.heal) return 6;
    return 7;
  };

  // Within a category, a card that would be Kindled (it follows a card of
  // the same suit this turn) goes first, then the dearer card.
  const rank = (inst) => {
    const kindled = sim.warden.lastSuit !== null && sim.warden.lastSuit === inst.card.suit;
    return category(inst) * 100 - (kindled ? 10 : 0) - inst.card.cost;
  };

  for (;;) {
    const playable = sim.warden.hand
      .filter((inst) => inst.card.cost <= sim.warden.ember)
      .sort((a, b) => rank(a) - rank(b));
    if (playable.length === 0) break;
    const pick = playable[0];
    const events = playCardByUid(sim, 'warden', pick.uid);
    if (!events) break;
    order.push(pick.uid);
    if (sim.winner) break;
  }
  return order;
}
