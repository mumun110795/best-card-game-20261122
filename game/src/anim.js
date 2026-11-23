// anim.js — the feel of the game: cards that slide and flip, damage that
// lands with a shake and a floating number, and a victory that bursts.
// Everything here is decoration over the engine's events; it never touches
// the state.

function fxLayer() {
  return document.getElementById('fx-layer');
}

// A number or word that floats up from a duelist's banner and fades.
export function floatText(who, text, cls) {
  const anchor = document.getElementById(who === 'player' ? 'player-zone' : 'warden-zone');
  if (!anchor) return;
  const node = document.createElement('div');
  node.className = 'floater ' + (cls || '');
  node.textContent = text;
  node.style.left = 42 + Math.random() * 16 + '%';
  fxLayer().append(node);
  // Position against the zone: the layer covers the table, zones are rows.
  node.style.top = who === 'player' ? '68%' : '8%';
  setTimeout(() => node.remove(), 1250);
}

export function shake(who) {
  const zone = document.getElementById(who === 'player' ? 'player-zone' : 'warden-zone');
  if (!zone) return;
  zone.classList.remove('shake');
  void zone.offsetWidth; // restart the animation
  zone.classList.add('shake');
}

// Turn the engine's events into sights and shakes.
export function playEvents(events) {
  for (const ev of events) {
    if (ev.t === 'damage' && ev.lifeLost > 0) {
      floatText(ev.who, `-${ev.lifeLost}`, 'dmg');
      shake(ev.who);
    } else if (ev.t === 'damage' && ev.absorbed > 0) {
      floatText(ev.who, `blocked ${ev.absorbed}`, 'blocked');
    } else if (ev.t === 'heal') {
      floatText(ev.who, `+${ev.amount} ♥`, 'heal');
    } else if (ev.t === 'guard') {
      floatText(ev.who, `+${ev.amount} guard`, 'guarded');
    } else if (ev.t === 'ember') {
      floatText(ev.who, `+${ev.amount} ember`, 'ember-up');
    }
  }
}

// A burst of ember sparks for the victory screen.
export function confettiBurst(container) {
  const colors = ['#e2483a', '#3a8fd9', '#43b04c', '#9a5fd0', '#f2b13c'];
  for (let i = 0; i < 46; i++) {
    const bit = document.createElement('span');
    bit.className = 'confetti';
    bit.style.left = Math.random() * 100 + '%';
    bit.style.background = colors[i % colors.length];
    bit.style.animationDelay = Math.random() * 0.7 + 's';
    bit.style.transform = `rotate(${Math.random() * 360}deg)`;
    container.append(bit);
    setTimeout(() => bit.remove(), 3400);
  }
}
