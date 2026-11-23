// random.js — a tiny seeded random number generator (mulberry32) whose whole
// state is one plain number, so a game state can be cloned and replayed
// exactly. Used for shuffling decks and for the deterministic screenshot
// setups; the live game seeds it from the clock.

export function makeRng(seed) {
  return { a: seed >>> 0 };
}

export function nextFloat(rng) {
  rng.a = (rng.a + 0x6d2b79f5) | 0;
  let t = rng.a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function nextInt(rng, below) {
  return Math.floor(nextFloat(rng) * below);
}

export function shuffleInPlace(rng, list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = nextInt(rng, i + 1);
    const tmp = list[i];
    list[i] = list[j];
    list[j] = tmp;
  }
  return list;
}
