// render.js — turns the engine's state into the table the player sees:
// both duelists' banners (life, guard, ember), the Warden's telegraphed
// intent, its face-down hand, the player's face-up hand, the last card
// played on the stage, and the turn log. It never changes the state.

import { SUITS } from './cards.js';

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

// One card face. `opts.kindledReady` marks a card in hand that would be
// Kindled if played now (it follows a card of the same suit this turn).
export function buildCardEl(inst, opts = {}) {
  const card = inst.card;
  const suit = SUITS[card.suit];
  const root = el('div', `card suit-${card.suit}`);
  root.style.setProperty('--suit', suit.color);
  root.style.setProperty('--suit-deep', suit.deep);
  root.dataset.uid = inst.uid;

  const top = el('div', 'card-top');
  const gem = el('div', 'cost-gem', String(card.cost));
  gem.title = `${card.cost} ember`;
  const glyph = el('div', 'suit-glyph', suit.glyph);
  top.append(gem, glyph);
  root.append(top);

  root.append(el('div', 'card-name', card.name));
  root.append(el('div', 'card-art', suit.glyph));
  root.append(el('div', 'card-text', card.text));
  root.append(el('div', 'card-kindled', card.kindledText));
  if (opts.kindledReady) root.append(el('div', 'kindled-tag', 'KINDLED READY'));
  if (opts.unaffordable) root.classList.add('unaffordable');
  return root;
}

function buildCardBackEl() {
  const root = el('div', 'card card-back');
  root.append(el('div', 'back-sigil', '✹'));
  return root;
}

function lifeBar(duelist) {
  const wrap = el('div', 'life-wrap');
  const pct = Math.max(0, Math.round((duelist.life / duelist.maxLife) * 100));
  const bar = el('div', 'life-bar');
  const fill = el('div', 'life-fill');
  fill.style.width = pct + '%';
  if (duelist.life <= 6) fill.classList.add('low');
  bar.append(fill);
  const label = el('div', 'life-label', `♥ ${duelist.life} / ${duelist.maxLife}`);
  wrap.append(bar, label);
  return wrap;
}

function emberPips(duelist) {
  const wrap = el('div', 'ember-pips');
  wrap.title = `Ember: ${duelist.ember} of ${duelist.emberMax}`;
  for (let i = 0; i < duelist.emberMax; i++) {
    wrap.append(el('span', 'pip' + (i < duelist.ember ? ' lit' : '')));
  }
  return wrap;
}

function statBadges(duelist) {
  const wrap = el('div', 'badges');
  const guard = el('span', 'badge guard-badge', `Guard ${duelist.guard}`);
  if (duelist.guard === 0) guard.classList.add('dim');
  wrap.append(guard);
  if (duelist.bramble > 0) wrap.append(el('span', 'badge bramble-badge', `Bramble ${duelist.bramble}`));
  wrap.append(el('span', 'badge deck-badge', `Deck ${duelist.deck.length} · Discard ${duelist.discard.length}`));
  return wrap;
}

const INTENT_LABEL = {
  strike: (n) => `INTENT — STRIKE for ${n}`,
  leech: (n) => `☾ INTENT — LEECH for ${n}`,
  ward: (n) => `INTENT — WARD ${n}`,
  mend: (n) => `● INTENT — MEND ${n}`,
  scheme: () => '✦ INTENT — SCHEME (draw & ember)',
};

export function render(state, ui) {
  // Warden banner and hand of card backs.
  const wardenStats = document.getElementById('warden-stats');
  wardenStats.replaceChildren(
    el('div', 'duelist-name', 'The Ashen Warden'),
    lifeBar(state.warden),
    emberPips(state.warden),
    statBadges(state.warden),
  );
  const wardenHand = document.getElementById('warden-hand');
  wardenHand.replaceChildren(...state.warden.hand.map(() => buildCardBackEl()));

  const intentEl = document.getElementById('intent-banner');
  const intent = state.warden.intent;
  if (intent && !state.winner) {
    intentEl.textContent = INTENT_LABEL[intent.kind](intent.amount);
    intentEl.className = 'intent show kind-' + intent.kind;
  } else {
    intentEl.className = 'intent';
    intentEl.textContent = '';
  }

  // Player banner and face-up hand.
  const playerStats = document.getElementById('player-stats');
  playerStats.replaceChildren(
    el('div', 'duelist-name', 'You — the Sparkbearer'),
    lifeBar(state.player),
    emberPips(state.player),
    statBadges(state.player),
  );
  const playerHand = document.getElementById('player-hand');
  const myTurn = state.active === 'player' && !state.winner && !ui.busy;
  playerHand.replaceChildren(
    ...state.player.hand.map((inst) => {
      const cardEl = buildCardEl(inst, {
        kindledReady: state.player.lastSuit === inst.card.suit,
        unaffordable: inst.card.cost > state.player.ember,
      });
      if (myTurn && inst.card.cost <= state.player.ember) {
        cardEl.classList.add('playable');
        cardEl.addEventListener('click', () => ui.onPlayCard(inst.uid));
      }
      return cardEl;
    }),
  );

  // The stage: the last card anyone played, face up in the middle.
  const stage = document.getElementById('stage');
  if (ui.lastPlayed) {
    const { card, kindled } = ui.lastPlayed;
    const stageCard = buildCardEl({ uid: 0, card });
    stageCard.classList.add('stage-card');
    if (kindled) stageCard.append(el('div', 'kindled-tag', 'KINDLED!'));
    stage.replaceChildren(stageCard);
  } else {
    stage.replaceChildren(el('div', 'stage-hint', 'The table is set. Your move, Sparkbearer.'));
  }

  // Turn banner and log.
  document.getElementById('turn-banner').textContent = state.winner
    ? 'The duel is decided'
    : state.active === 'player'
      ? `Turn ${state.turn} — your move`
      : `Turn ${state.turn} — the Warden acts`;
  const log = document.getElementById('log');
  log.replaceChildren(...state.log.slice(-3).map((line) => el('div', 'log-line', line)));

  document.getElementById('btn-end').disabled = !myTurn;
}
