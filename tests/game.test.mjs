// Run with Node directly: node tests/game.test.mjs (no packages required).
// Game's browser-only renderer is replaced with a no-op in an isolated VM;
// physics, state transitions and the actual level definitions remain unchanged.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { Player } from '../Player.js';
import { LEVELS } from '../levels.js';
import { overlaps, moveAndCollide } from '../collision.js';

const source = readFileSync(new URL('../Game.js', import.meta.url), 'utf8')
  .replace(/^import .*;\r?$/gm, '')
  .replace('export class Game', 'class Game');

function fixture({ blockedStorage = false, saved = new Map() } = {}) {
  const frames = new Map();
  const listeners = new Map();
  const snapshots = [];
  let nextId = 0;
  const document = {
    hidden: false,
    addEventListener: (event, fn) => listeners.set(event, fn),
    removeEventListener: event => listeners.delete(event),
  };
  const localStorage = {
    getItem(key) {
      if (blockedStorage) throw new Error('Storage denied');
      return saved.get(key) ?? null;
    },
    setItem(key, value) {
      if (blockedStorage) throw new Error('Storage denied');
      saved.set(key, value);
    },
  };
  const context = vm.createContext({
    Player, overlaps, LEVELS, render() {}, document, localStorage,
    requestAnimationFrame(fn) { frames.set(++nextId, fn); return nextId; },
    cancelAnimationFrame(id) { frames.delete(id); },
  });
  const Game = vm.runInContext(source + '\nGame;', context, {
    filename: fileURLToPath(new URL('../Game.js', import.meta.url)),
  });
  const input = {
    axis: 0, queued: false, clears: 0,
    consumeJump() { const jump = this.queued; this.queued = false; return jump; },
    clear() { this.queued = false; this.clears += 1; },
  };
  const game = new Game({ getContext: () => ({}) }, input, state => snapshots.push(state));
  return { game, input, frames, document, listeners, saved, snapshots };
}

function test(name, run) {
  run();
  console.log('PASS ' + name);
}

test('six authored routes and six mirrored routes: all parcels reachable without teleporting', () => {
  const { game } = fixture();
  for (const shift of [1, 2]) for (let levelIndex = 0; levelIndex < LEVELS.length; levelIndex += 1) {
    game.shift = shift;
    game.levelIndex = levelIndex;
    game.loadLevel();
    const { level } = game;
    if (levelIndex === 0) assert.equal(level.platforms.length, 5);
    assert.equal(level.items.length, 3);
    const player = new Player(level.spawn.x, level.spawn.y);
    const collected = new Set();
    const controls = { axis: 1, jump: false, consumeJump() { const jump = this.jump; this.jump = false; return jump; } };
    const steer = target => {
      const distance = target - player.x;
      const braking = player.vx * player.vx / 5000 + 3;
      return Math.abs(distance) <= braking ? 0 : Math.sign(distance);
    };
    let platformIndex = 0;
    let airborne = false;
    let reached = false;
    for (let step = 0; step < 7200; step += 1) {
      const current = level.platforms[platformIndex];
      const next = level.platforms[platformIndex + 1];
      const pendingParcel = level.items.find((item, index) => !collected.has(index) &&
        item.x >= current.x && item.x < current.x + current.w && item.y === current.y - 40);
      if (!airborne && pendingParcel) controls.axis = steer(pendingParcel.x - 10);
      else if (!next) controls.axis = steer(level.finish.x + 5);
      else if (!airborne) {
        const direction = Math.sign(next.x - current.x);
        const launch = direction > 0 ? current.x + current.w - player.w - 18 : current.x + 18;
        controls.axis = direction;
        if (player.grounded && (direction > 0 ? player.x >= launch : player.x <= launch)) {
          controls.jump = true;
          airborne = true;
        }
      } else {
        controls.axis = steer(next.x + next.w / 2 - player.w / 2);
      }
      player.update(1 / 120, controls, level.platforms);
      if (airborne && player.grounded && Math.abs(player.y + player.h - next.y) < 0.1 &&
        player.x + player.w > next.x && player.x < next.x + next.w) {
        platformIndex += 1;
        airborne = false;
      }
      level.items.forEach((item, index) => {
        if (overlaps(player, item)) collected.add(index);
      });
      assert.ok(player.y < 640, `Level ${levelIndex + 1}: fell at x=${player.x}`);
      assert.ok(!level.hazards.some(hazard => overlaps(player, hazard)));
      if (collected.size === 3 && overlaps(player, level.finish)) { reached = true; break; }
    }
    assert.ok(reached, `Level ${levelIndex + 1}: finish unreachable at ${player.x},${player.y}; platform ${platformIndex}`);
    assert.equal(collected.size, 3, `Level ${levelIndex + 1}: missed a parcel; collected ${[...collected]}`);
  }
  game.destroy();
});

test('solid collision from above, below and both sides; no tunneling', () => {
  const floor = { x: -10, y: 50, w: 100, h: 5 };
  const falling = { x: 0, y: 0, w: 10, h: 10, vx: 0, vy: 1200 };
  moveAndCollide(falling, [floor], 0.1);
  assert.equal(falling.y, 40);
  assert.equal(falling.vy, 0);
  assert.equal(falling.grounded, true);
  const rising = { x: 20, y: 60, w: 10, h: 10, vx: 0, vy: -1200 };
  moveAndCollide(rising, [floor], 0.1);
  assert.equal(rising.y, 55);
  assert.equal(rising.vy, 0);
  const wall = { x: 50, y: 0, w: 5, h: 100 };
  const rightward = { x: 0, y: 15, w: 10, h: 10, vx: 1000, vy: 0 };
  moveAndCollide(rightward, [wall], 0.1);
  assert.equal(rightward.x, 40);
  const leftward = { x: 90, y: 15, w: 10, h: 10, vx: -1000, vy: 0 };
  moveAndCollide(leftward, [wall], 0.1);
  assert.equal(leftward.x, 55);
});

test('jump requires support, a fresh air press cannot double-jump', () => {
  const player = new Player(20, 100);
  player.vy = 20;
  player.update(1 / 120, { axis: 0, consumeJump: () => true }, []);
  assert.ok(player.vy > 0);
  player.grounded = true;
  player.update(1 / 120, { axis: 0, consumeJump: () => true }, []);
  assert.ok(player.vy < 0);
  const before = player.vy;
  player.update(1 / 120, { axis: 0, consumeJump: () => true }, []);
  assert.ok(player.vy > before, 'A second press must not reset upward velocity');
});

test('one RAF after duplicate start and five consecutive restarts', () => {
  const { game, frames } = fixture();
  game.start();
  game.start();
  assert.equal(frames.size, 1);
  for (let count = 0; count < 5; count += 1) {
    game.score = 2;
    game.level.items[0].collected = true;
    game.restart();
    assert.equal(frames.size, 1);
    assert.equal(game.score, 0);
    assert.equal(game.levelIndex, 0);
    assert.ok(game.level.items.every(item => !item.collected));
    assert.equal(game.player.x, game.level.spawn.x);
  }
  game.destroy();
  assert.equal(frames.size, 0);
});

test('pause/resume resets frame time; hidden tab pauses and clears controls', () => {
  const { game, input, frames, document, listeners } = fixture();
  game.start();
  game.lastTime = 100;
  game.togglePause();
  assert.equal(game.status, 'paused');
  assert.equal(frames.size, 0);
  game.togglePause();
  assert.equal(game.status, 'running');
  assert.equal(game.lastTime, null);
  assert.equal(frames.size, 1);
  const previousClears = input.clears;
  document.hidden = true;
  listeners.get('visibilitychange')();
  assert.equal(game.status, 'paused');
  assert.equal(frames.size, 0);
  assert.ok(input.clears > previousClears);
  document.hidden = false;
  listeners.get('visibilitychange')();
  assert.equal(game.status, 'paused', 'Returning must not resume without user action');
  game.destroy();
  assert.equal(listeners.size, 0);
});

test('scoring is once per item; record persists and blocked storage is tolerated', () => {
  for (const blockedStorage of [false, true]) {
    const { game, saved } = fixture({ blockedStorage });
    game.start();
    game.player.x = 390;
    game.player.y = 397;
    game.update(1 / 120);
    game.update(1 / 120);
    assert.equal(game.score, 1);
    assert.equal(game.best, 1);
    assert.equal(game.storageAvailable, !blockedStorage);
    if (!blockedStorage) assert.equal(JSON.parse(saved.get('courier-career-v2')).best, 1);
    game.restart();
    assert.equal(game.best, 1);
    game.destroy();
  }
});

test('hazard and falling cause a frozen loss; incomplete finish cannot win', () => {
  const { game, frames } = fixture();
  game.start();
  game.player.x = 1120;
  game.player.y = 482;
  game.update(1 / 120);
  assert.equal(game.status, 'running');
  game.player.x = 300;
  game.player.y = 620;
  game.update(1 / 120);
  assert.equal(game.status, 'lost');
  assert.equal(frames.size, 0);
  const before = game.player.y;
  game.update(1);
  assert.equal(game.player.y, before);
  game.restart();
  game.player.x = 0;
  game.player.y = 700;
  game.update(1 / 120);
  assert.equal(game.status, 'lost');
  game.destroy();
});

test('six deliveries pay once; next shift mirrors routes and retains earnings', () => {
  const { game, frames } = fixture();
  game.start();
  for (let levelIndex = 0; levelIndex < LEVELS.length; levelIndex += 1) {
    for (const item of game.level.items) item.collected = true;
    game.score = (levelIndex + 1) * 3;
    game.player.x = game.level.finish.x + game.level.finish.w - 15;
    game.player.y = game.level.finish.y + game.level.finish.h - game.player.h;
    game.update(1 / 120);
    const wallet = game.wallet;
    game.deliver();
    game.update(1);
    assert.equal(game.wallet, wallet, 'Finished order must not pay twice');
    assert.equal(frames.size, 0);
    if (levelIndex < LEVELS.length - 1) {
      assert.equal(game.status, 'level-complete');
      game.start();
      assert.equal(game.levelIndex, levelIndex + 1);
      assert.ok(game.level.items.every(item => !item.collected));
    }
  }
  assert.equal(game.status, 'won');
  assert.equal(game.best, 18);
  const wallet = game.wallet;
  game.start();
  assert.equal(game.shift, 2);
  assert.equal(game.score, 18);
  assert.equal(game.wallet, wallet);
  assert.equal(game.level.spawn.x, 1200 - LEVELS[0].spawn.x - 52);
  assert.equal(frames.size, 1);
  game.destroy();
});

test('optional tips pay only on delivery; retry rolls back this order, not previous earnings', () => {
  const { game } = fixture();
  game.start();
  const coin = game.level.coins[0];
  game.player.x = coin.x; game.player.y = coin.y - 20;
  game.update(1 / 120);
  assert.equal(game.tips, 1);
  assert.equal(game.wallet, 0);
  game.update(1 / 120);
  assert.equal(game.tips, 1);
  game.score = 2;
  game.finishState('lost', 'test');
  game.start();
  assert.equal(game.levelIndex, 0);
  assert.equal(game.score, 0);
  assert.equal(game.tips, 0);
  assert.equal(game.wallet, 0);
  game.timeLeft = 0;
  game.tips = 2;
  game.deliver();
  assert.equal(game.wallet, 80);
  game.start();
  game.score += 1;
  game.finishState('lost', 'test');
  game.start();
  assert.equal(game.levelIndex, 1);
  assert.equal(game.score, game.levelStartScore);
  assert.equal(game.wallet, 80);
  game.destroy();
});

test('upgrades require a completed order and money; persist with checkpoint across reload', () => {
  const { game, saved } = fixture();
  game.start();
  assert.equal(game.buyUpgrade('grip'), false);
  game.timeLeft = 60; game.deliver();
  assert.equal(game.buyUpgrade('unknown'), false);
  assert.equal(game.buyUpgrade('grip'), true);
  assert.equal(game.wallet, 20);
  assert.equal(game.upgrades.grip, 1);
  assert.equal(game.buyUpgrade('bonus'), false);
  const restored = fixture({ saved }).game;
  assert.equal(restored.wallet, 20);
  assert.equal(restored.upgrades.grip, 1);
  assert.equal(restored.levelIndex, 1);
  assert.equal(restored.player.grip, 1);
  assert.equal(restored.status, 'ready');
  game.start();
  game.wallet = 500;
  game.finishState('level-complete', 'test');
  assert.equal(game.buyUpgrade('bonus'), true);
  game.start();
  game.timeLeft = 0; game.deliver();
  assert.equal(game.deliveryReward, 48);
  game.destroy(); restored.destroy();
});

test('soft timer freezes on pause and never loses an order; brake reduces stopping distance', () => {
  const { game } = fixture();
  game.start(); game.timeLeft = 0.001; game.update(1 / 120);
  assert.equal(game.timeLeft, 0);
  assert.equal(game.status, 'running');
  game.pause(); const time = game.timeLeft; game.update(30);
  assert.equal(game.timeLeft, time);
  const free = new Player(100, 100), braked = new Player(100, 100);
  free.vx = braked.vx = 310;
  let distance = [0, 0];
  for (let i = 0; i < 30; i++) {
    free.update(1 / 120, {axis:0,consumeJump:()=>false}, []);
    braked.update(1 / 120, {axis:0,brake:true,consumeJump:()=>false}, []);
    distance = [free.x - 100, braked.x - 100];
  }
  assert.ok(distance[1] < distance[0] / 2);
  game.destroy();
});

test('corrupt and invalid career data is bounded; old records migrate', () => {
  for (const raw of ['{broken', 'null', '{"version":100}', '{"version":2,"wallet":-50,"upgrades":{"grip":200,"bonus":-4},"run":{"shift":-2,"levelIndex":10000,"score":-3}}']) {
    const { game } = fixture({ saved: new Map([['courier-career-v2', raw]]) });
    assert.ok(game.wallet >= 0);
    assert.ok(game.upgrades.grip <= 3 && game.upgrades.bonus >= 0);
    assert.ok(game.shift >= 1 && game.levelIndex < LEVELS.length);
    game.destroy();
  }
  const { game } = fixture({ saved: new Map([['courier-last-order-best-v1', '9']]) });
  assert.equal(game.best, 9); game.destroy();
});

test('dog patrol moves only while playing; side hit loses, landing safely bounces', () => {
  const { game } = fixture();
  game.levelIndex = 3; game.loadLevel(); game.start();
  const dog = game.level.dogs[0], x = dog.x;
  game.update(1 / 120);
  assert.notEqual(dog.x, x);
  game.pause(); const pausedX = dog.x; game.update(1);
  assert.equal(dog.x, pausedX);
  game.start();
  game.player.x = dog.x; game.player.y = dog.y - game.player.h - 1; game.player.vy = 240;
  game.update(1 / 120);
  assert.equal(game.status, 'running');
  assert.ok(game.player.vy < 0);
  game.player.x = dog.x; game.player.y = dog.y - 20; game.player.vy = 0;
  game.update(1 / 120);
  assert.equal(game.status, 'lost');
  game.destroy();
});

test('advanced routes can be delivered with live dogs and ordinary movement', () => {
  for (const shift of [1, 2]) for (const levelIndex of [3, 4, 5]) {
    let completed = false;
    for (let attempt = 0; attempt < 12 && !completed; attempt++) {
      const { game, input } = fixture();
      game.shift = shift; game.levelIndex = levelIndex; game.loadLevel(); game.start();
      const { level, player } = game;
      let platformIndex = 0;
      const steer = target => {
        const distance = target - player.x;
        return Math.abs(distance) < player.vx * player.vx / 5000 + 3 ? 0 : Math.sign(distance);
      };
      for (let i = 0; i < attempt * 24 && game.status === 'running'; i++) game.update(1 / 120);
      for (let frame = 0; frame < 5000 && game.status === 'running'; frame++) {
        if (player.grounded) {
          const standing = level.platforms.findIndex(p => Math.abs(player.y + player.h - p.y) < .1 && player.x < p.x + p.w && player.x + player.w > p.x);
          if (standing >= 0) platformIndex = standing;
        }
        const current = level.platforms[platformIndex], next = level.platforms[platformIndex + 1];
        const pending = level.items.find(item => !item.collected && item.x >= current.x && item.x < current.x + current.w && item.y === current.y - 40);
        if (player.grounded && pending) input.axis = steer(pending.x - 10);
        else if (!next) input.axis = steer(level.finish.x + level.finish.w / 2 - player.w / 2);
        else if (player.grounded) {
          const direction = Math.sign(next.x - current.x);
          const launch = direction > 0 ? current.x + current.w - player.w - 18 : current.x + 18;
          input.axis = direction;
          if (direction > 0 ? player.x >= launch : player.x <= launch) input.queued = true;
        } else input.axis = steer(next.x + next.w / 2 - player.w / 2);
        if (player.grounded) {
          const dangerAhead = level.dogs.some(dog => {
            const gap = input.axis < 0 ? player.x - dog.x - dog.w : dog.x - player.x - player.w;
            return Math.abs(dog.y + dog.h - current.y) < 1 && gap >= 0 && gap < 55;
          });
          if (dangerAhead) input.queued = true;
        }
        const previousVy = player.vy;
        game.update(1 / 120);
        if (previousVy >= 0 && player.vy === -420) {
          const bounced = level.platforms.findIndex(p => Math.abs(p.y - (player.y + player.h + 30)) < 1);
          if (bounced >= 0) platformIndex = bounced;
        }
      }
      completed = ['won', 'level-complete'].includes(game.status);
      game.destroy();
    }
    assert.ok(completed, `Dog route ${levelIndex + 1}, shift ${shift} cannot be delivered by jump-and-steer controller`);
  }
});

console.log('All gameplay checks passed.');
