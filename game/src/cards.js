// cards.js — the card catalogue of Emberfall: Duel of the Four Sparks.
// Every card belongs to one of four suits, each told apart by colour AND by
// shape: Flame is red with a triangle, Tide is blue with a circle, Thorn is
// green with a diamond, Gloom is violet with a crescent.
//
// A card's `fx` describes what it does; `kindledFx` is the bonus that fires
// when the previous card played this same turn shared its suit — so the
// order you play your hand in is a decision every single turn.

export const SUITS = {
  flame: { name: 'Flame', glyph: '▲', color: '#e2483a', deep: '#8f1f16' },
  tide: { name: 'Tide', glyph: '●', color: '#3a8fd9', deep: '#17507f' },
  thorn: { name: 'Thorn', glyph: '◆', color: '#43b04c', deep: '#1d6126' },
  gloom: { name: 'Gloom', glyph: '☾', color: '#9a5fd0', deep: '#552a7d' },
};

export const CARDS = [
  // — Flame: burn the other duelist down. —
  { id: 'spark-jab', name: 'Spark Jab', suit: 'flame', cost: 1,
    text: 'Deal 3 damage.', kindledText: 'Kindled: +2 damage.',
    fx: { damage: 3 }, kindledFx: { damage: 2 } },
  { id: 'ember-lance', name: 'Ember Lance', suit: 'flame', cost: 2,
    text: 'Deal 5 damage.', kindledText: 'Kindled: +2 damage.',
    fx: { damage: 5 }, kindledFx: { damage: 2 } },
  { id: 'twin-flames', name: 'Twin Flames', suit: 'flame', cost: 2,
    text: 'Deal 2 damage, then 2 more past Guard.', kindledText: 'Kindled: second hit +1.',
    fx: { damage: 2, damage2: 2, ignoreGuard2: true }, kindledFx: { damage2: 1 } },
  { id: 'pyre-blast', name: 'Pyre Blast', suit: 'flame', cost: 3,
    text: 'Deal 7 damage.', kindledText: 'Kindled: +3 damage.',
    fx: { damage: 7 }, kindledFx: { damage: 3 } },
  { id: 'wildfire', name: 'Wildfire', suit: 'flame', cost: 4,
    text: 'Deal 4 damage, and 4 more if the foe has no Guard.', kindledText: 'Kindled: +2 damage.',
    fx: { damage: 4, bonusIfUnguarded: 4 }, kindledFx: { damage: 2 } },

  // — Tide: mend, refill, keep the hand full. —
  { id: 'cool-draught', name: 'Cool Draught', suit: 'tide', cost: 1,
    text: 'Heal 3 life.', kindledText: 'Kindled: +2 healing.',
    fx: { heal: 3 }, kindledFx: { heal: 2 } },
  { id: 'spring-tide', name: 'Spring Tide', suit: 'tide', cost: 2,
    text: 'Heal 4 life and draw a card.', kindledText: 'Kindled: draw 1 more.',
    fx: { heal: 4, draw: 1 }, kindledFx: { draw: 1 } },
  { id: 'mist-veil', name: 'Mist Veil', suit: 'tide', cost: 2,
    text: 'Gain 4 Guard and heal 2 life.', kindledText: 'Kindled: +2 Guard.',
    fx: { guard: 4, heal: 2 }, kindledFx: { guard: 2 } },
  { id: 'deep-well', name: 'Deep Well', suit: 'tide', cost: 3,
    text: 'Draw 3 cards.', kindledText: 'Kindled: gain 1 ember.',
    fx: { draw: 3 }, kindledFx: { ember: 1 } },

  // — Thorn: raise a guard wall that bites back. —
  { id: 'briar-guard', name: 'Briar Guard', suit: 'thorn', cost: 1,
    text: 'Gain 5 Guard.', kindledText: 'Kindled: +3 Guard.',
    fx: { guard: 5 }, kindledFx: { guard: 3 } },
  { id: 'thorn-lash', name: 'Thorn Lash', suit: 'thorn', cost: 2,
    text: 'Gain 3 Guard and deal 3 damage.', kindledText: 'Kindled: +2 damage.',
    fx: { guard: 3, damage: 3 }, kindledFx: { damage: 2 } },
  { id: 'bramble-skin', name: 'Bramble Skin', suit: 'thorn', cost: 2,
    text: 'Gain 6 Guard. Until your next turn, foes who strike your Guard take 2 damage.', kindledText: 'Kindled: +2 Guard.',
    fx: { guard: 6, bramble: 2 }, kindledFx: { guard: 2 } },
  { id: 'hedge-wall', name: 'Hedge Wall', suit: 'thorn', cost: 3,
    text: 'Gain 9 Guard.', kindledText: 'Kindled: +3 Guard.',
    fx: { guard: 9 }, kindledFx: { guard: 3 } },

  // — Gloom: take life and ember for yourself. —
  { id: 'grave-ember', name: 'Grave Ember', suit: 'gloom', cost: 1,
    text: 'Gain 2 ember this turn.', kindledText: 'Kindled: draw a card.',
    fx: { ember: 2 }, kindledFx: { draw: 1 } },
  { id: 'siphon', name: 'Siphon', suit: 'gloom', cost: 2,
    text: 'Deal 3 damage and heal 3 life.', kindledText: 'Kindled: both +1.',
    fx: { damage: 3, heal: 3 }, kindledFx: { damage: 1, heal: 1 } },
  { id: 'night-drain', name: 'Night Drain', suit: 'gloom', cost: 3,
    text: 'Deal 5 damage and heal 2 life.', kindledText: 'Kindled: +2 damage.',
    fx: { damage: 5, heal: 2 }, kindledFx: { damage: 2 } },
  { id: 'doom-herald', name: 'Doom Herald', suit: 'gloom', cost: 4,
    text: 'Deal 6 damage — or 9 if the foe is at 8 life or less.', kindledText: 'Kindled: +2 damage.',
    fx: { damage: 6, executeBelow: 8, executeDamage: 9 }, kindledFx: { damage: 2 } },
];

export function cardById(id) {
  return CARDS.find((c) => c.id === id);
}

// The 26-card deck both duelists bring to the table.
export const DECK_RECIPE = [
  ['spark-jab', 2], ['ember-lance', 2], ['twin-flames', 2], ['pyre-blast', 1], ['wildfire', 1],
  ['cool-draught', 2], ['spring-tide', 2], ['mist-veil', 1], ['deep-well', 1],
  ['briar-guard', 3], ['thorn-lash', 2], ['bramble-skin', 1], ['hedge-wall', 1],
  ['grave-ember', 1], ['siphon', 2], ['night-drain', 1], ['doom-herald', 1],
];
