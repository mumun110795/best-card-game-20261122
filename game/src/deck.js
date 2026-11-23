// deck.js — builds a duelist's deck from the recipe in cards.js, shuffles
// it, deals draws from it and folds the discard pile back in when it runs
// dry. A card in a deck or hand is an "instance": the catalogue card plus a
// unique uid, so two copies of the same card never get confused.

import { cardById, DECK_RECIPE } from './cards.js';
import { shuffleInPlace } from './random.js';

let nextUid = 1;

export function buildDeck(rng) {
  const instances = [];
  for (const [cardId, count] of DECK_RECIPE) {
    for (let i = 0; i < count; i++) {
      instances.push({ uid: nextUid++, card: cardById(cardId) });
    }
  }
  return shuffleInPlace(rng, instances);
}

// Draw up to `count` cards into the duelist's hand (hand limit applies).
// Returns how many cards were actually drawn.
export function drawCards(state, duelist, count) {
  let drawn = 0;
  while (drawn < count && duelist.hand.length < state.handLimit) {
    if (duelist.deck.length === 0) {
      if (duelist.discard.length === 0) break;
      duelist.deck = shuffleInPlace(state.rng, duelist.discard);
      duelist.discard = [];
    }
    duelist.hand.push(duelist.deck.pop());
    drawn++;
  }
  return drawn;
}

export function findInHand(duelist, uid) {
  return duelist.hand.findIndex((inst) => inst.uid === uid);
}
