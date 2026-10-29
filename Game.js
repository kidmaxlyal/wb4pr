import { Player } from './Player.js';
import { overlaps } from './collision.js';
import { render } from './renderer.js';
import { LEVELS } from './levels.js';

const STEP = 1 / 120;
const SAVE_KEY = 'courier-career-v2';
const LEGACY_KEY = 'courier-last-order-best-v1';
const integer = (value, fallback = 0, max = 1e9) =>
  Number.isFinite(value) ? Math.min(max, Math.max(0, Math.floor(value))) : fallback;

export class Game {
  constructor(canvas, input, onState = () => {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = input;
    this.onState = onState;
    this.status = 'ready';
    this.score = 0;
    this.best = 0;
    this.wallet = 0;
    this.shift = 1;
    this.upgrades = { grip: 0, bonus: 0 };
    this.deliveries = 0;
    this.storageAvailable = true;
    this.levelIndex = 0;
    this.elapsed = 0;
    this.deliveryReward = 0;
    this.frame = null;
    this.lastTime = null;
    this.accumulator = 0;
    this.readCareer();
    this.tick = this.tick.bind(this);
    this.loadLevel();
    this.visibilityHandler = () => {
      if (document.hidden && this.status === 'running') this.pause('Вкладка скрыта. Заказ подождёт.');
      if (document.hidden) this.input.clear();
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
    this.message = 'Три посылки до подъезда. Чаевые по желанию. S или ↓ — тормоз.';
    this.notify();
    this.draw();
  }

  readCareer() {
    try {
      const legacy = Number(localStorage.getItem(LEGACY_KEY));
      this.best = integer(legacy);
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      let data;
      try { data = JSON.parse(raw); } catch { return; }
      if (!data || data.version !== 2) return;
      this.wallet = integer(data.wallet);
      this.best = Math.max(this.best, integer(data.best));
      this.deliveries = integer(data.deliveries);
      this.upgrades.grip = integer(data.upgrades?.grip, 0, 3);
      this.upgrades.bonus = integer(data.upgrades?.bonus, 0, 3);
      this.shift = Math.max(1, integer(data.run?.shift, 1, 9999));
      this.levelIndex = integer(data.run?.levelIndex, 0, LEVELS.length - 1);
      this.score = integer(data.run?.score);
      this.resumed = this.levelIndex > 0 || this.shift > 1;
    } catch { this.storageAvailable = false; }
  }

  saveCareer() {
    let shift = this.shift, levelIndex = this.levelIndex;
    if (this.status === 'level-complete') levelIndex += 1;
    if (this.status === 'won') { levelIndex = 0; shift += 1; }
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        version: 2, wallet: this.wallet, best: this.best,
        deliveries: this.deliveries, upgrades: this.upgrades,
        run: { shift, levelIndex, score: ['level-complete', 'won'].includes(this.status) ? this.score : this.levelStartScore },
      }));
    } catch { this.storageAvailable = false; }
  }

  loadLevel() {
    const source = LEVELS[this.levelIndex];
    const mirror = this.shift % 2 === 0;
    const transform = item => ({ ...item, x: mirror ? 1200 - item.x - item.w : item.x });
    const platforms = source.platforms.map(transform);
    const items = source.items.map(item => transform({ ...item, w: 28, h: 28, collected: false }));
    const coins = source.coins.map(item => transform({ ...item, w: 24, h: 24, collected: false }));
    const speedFactor = 1 + Math.min(this.shift - 1, 6) * 0.12;
    const dogs = source.dogs.map(dog => {
      const baseX = mirror ? 1200 - dog.baseX - 45 : dog.baseX;
      return { ...dog, baseX, x: baseX, w: 45, h: 30, speed: dog.speed * speedFactor };
    });
    // Later shifts reverse the same physically validated routes, not jump distances.
    this.level = {
      ...source, platforms, items, coins, dogs,
      hazards: source.hazards.map(transform), finish: transform(source.finish),
      spawn: { x: mirror ? 1200 - source.spawn.x - 52 : source.spawn.x, y: source.spawn.y },
    };
    this.player = new Player(this.level.spawn.x, this.level.spawn.y);
    this.player.facing = mirror ? -1 : (this.level.platforms[1].x < platforms[0].x ? -1 : 1);
    this.player.grounded = true;
    this.player.grip = this.upgrades.grip;
    this.timeLeft = Math.max(25, source.orderSeconds - Math.min(this.shift - 1, 6) * 3);
    this.orderElapsed = 0;
    this.lastSecond = Math.ceil(this.timeLeft);
    this.tips = 0;
    this.deliveryReward = 0;
    this.levelStartScore = this.score;
    this.input.clear();
  }

  get upgradeCosts() {
    return { grip: 80 * (this.upgrades.grip + 1), bonus: 120 * (this.upgrades.bonus + 1) };
  }

  notify() {
    this.onState({
      status: this.status, score: this.score, best: this.best, message: this.message,
      level: this.levelIndex + 1, totalLevels: LEVELS.length, levelName: this.level.name,
      collected: this.level.items.filter(item => item.collected).length,
      totalItems: this.level.items.length, storageAvailable: this.storageAvailable,
      shift: this.shift, wallet: this.wallet, remaining: this.timeLeft,
      timeLeft: this.timeLeft, deliveryReward: this.deliveryReward, tips: this.tips,
      upgrades: { ...this.upgrades }, upgradeCosts: this.upgradeCosts,
      deliveries: this.deliveries, resumed: this.resumed,
    });
  }

  start() {
    if (this.status === 'running') return;
    if (this.status === 'lost') { this.retry(); return; }
    if (this.status === 'won') {
      this.shift += 1;
      this.levelIndex = 0;
      this.loadLevel();
    } else if (this.status === 'level-complete') {
      this.levelIndex += 1;
      this.loadLevel();
    }
    this.status = 'running';
    this.input.clear();
    this.input.active = true;
    this.message = this.level.subtitle;
    this.lastTime = null;
    this.accumulator = 0;
    this.notify();
    this.schedule();
  }

  retry() {
    this.stopLoop();
    this.score = this.levelStartScore;
    this.loadLevel();
    this.status = 'ready';
    this.start();
    this.draw();
  }

  buyUpgrade(type) {
    if (!['level-complete', 'won'].includes(this.status) || !['grip', 'bonus'].includes(type)) return false;
    const cost = this.upgradeCosts[type];
    if (this.upgrades[type] >= 3 || this.wallet < cost) return false;
    this.wallet -= cost;
    this.upgrades[type] += 1;
    this.player.grip = this.upgrades.grip;
    this.message = type === 'grip' ? 'Тормоза настроены. Посадки станут точнее.' : 'Термосумка установлена. Следующие заказы дороже.';
    this.saveCareer();
    this.notify();
    return true;
  }

  schedule() {
    if (this.frame === null && this.status === 'running') this.frame = requestAnimationFrame(this.tick);
  }

  stopLoop() {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    this.lastTime = null;
    this.accumulator = 0;
    this.input.active = false;
    this.input.clear();
  }

  pause(message = 'Перерыв без оплаты. Можно выдохнуть.') {
    if (this.status !== 'running') return;
    this.status = 'paused';
    this.message = message;
    this.stopLoop();
    this.notify();
    this.draw();
  }

  togglePause() {
    if (this.status === 'running') this.pause();
    else if (this.status === 'paused') this.start();
  }

  restart() {
    this.stopLoop();
    this.score = 0;
    this.levelIndex = 0;
    this.shift = 1;
    this.elapsed = 0;
    this.loadLevel();
    this.status = 'ready';
    this.saveCareer();
    this.start();
    this.draw();
  }

  updateBest() {
    if (this.score <= this.best) return;
    this.best = this.score;
    this.saveCareer();
  }

  finishState(status, message) {
    this.status = status;
    this.message = message;
    this.stopLoop();
    this.updateBest();
    this.notify();
  }

  deliver() {
    if (this.status !== 'running') return;
    const speedBonus = Math.ceil(this.timeLeft);
    this.deliveryReward = Math.round((40 + speedBonus + this.tips * 20) * (1 + this.upgrades.bonus * 0.2));
    this.wallet = Math.min(1e9, this.wallet + this.deliveryReward);
    this.deliveries += 1;
    const final = this.levelIndex + 1 === LEVELS.length;
    this.finishState(final ? 'won' : 'level-complete',
      'Доставлено: +' + this.deliveryReward + ' ₽. Чаевые ' + this.tips + '/2. Можно улучшить велосипед.');
    this.saveCareer();
  }

  update(dt) {
    if (this.status !== 'running') return;
    this.elapsed += dt;
    this.orderElapsed += dt;
    this.timeLeft = Math.max(0, this.timeLeft - dt);
    const previousBottom = this.player.y + this.player.h;
    this.player.update(dt, this.input, this.level.platforms);
    for (const dog of this.level.dogs) {
      dog.x = dog.baseX + Math.sin(this.orderElapsed * dog.speed + dog.phase) * dog.range;
    }
    if (this.player.y > 650 || this.level.hazards.some(hazard => overlaps(this.player, hazard))) {
      this.finishState('lost', 'Провал в дороге. Повторите этот двор: заработанное не пропало.');
      return;
    }
    for (const dog of this.level.dogs) {
      if (!overlaps(this.player, dog)) continue;
      // A jump onto the dog safely bounces the rider; side contact ends this attempt.
      if (previousBottom <= dog.y + 8 && this.player.vy >= 0) {
        this.player.y = dog.y - this.player.h;
        this.player.vy = -420;
        this.message = 'Перепрыгнули охрану. Посылки целы.';
      } else {
        this.finishState('lost', 'Местная охрана против доставки. Перепрыгните собаку в следующей попытке.');
        return;
      }
    }
    let changed = false;
    for (const item of this.level.items) {
      if (!item.collected && overlaps(this.player, item)) {
        item.collected = true;
        this.score += 1;
        changed = true;
      }
    }
    for (const coin of this.level.coins) {
      if (!coin.collected && overlaps(this.player, coin)) {
        coin.collected = true;
        this.tips += 1;
        this.message = '+20 ₽ чаевых при доставке. Забрать все необязательно.';
        changed = true;
      }
    }
    if (changed) this.updateBest();
    if (overlaps(this.player, this.level.finish)) {
      if (this.level.items.every(item => item.collected)) { this.deliver(); return; }
      if (this.message !== 'Сначала заберите все три посылки во дворе.') {
        this.message = 'Сначала заберите все три посылки во дворе.';
        changed = true;
      }
    }
    const second = Math.ceil(this.timeLeft);
    if (second !== this.lastSecond) {
      this.lastSecond = second;
      changed = true;
      if (second === 0) this.message = 'Бонус за скорость закончился. Доставку всё ещё можно завершить.';
    }
    if (changed) this.notify();
  }

  tick(timestamp) {
    this.frame = null;
    if (this.status !== 'running') return;
    const dt = this.lastTime === null ? 0 : Math.min((timestamp - this.lastTime) / 1000, 0.08);
    this.lastTime = timestamp;
    this.accumulator += Math.max(0, dt);
    while (this.accumulator >= STEP && this.status === 'running') {
      this.accumulator -= STEP;
      this.update(STEP);
    }
    this.draw();
    this.schedule();
  }

  draw() { render(this.ctx, this, this.elapsed); }

  destroy() {
    this.stopLoop();
    document.removeEventListener('visibilitychange', this.visibilityHandler);
  }
}
