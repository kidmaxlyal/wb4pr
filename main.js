import { Game } from './Game.js';
import { Input } from './input.js';

const $ = (id) => document.getElementById(id);
const canvas = $('game');
const input = new Input(document);
const labels = {
  ready: ['Вечерняя смена', 'До двери', 'Три посылки до подъезда. Чаевые по пути, собаки во дворе. Зарабатывайте на улучшения и следующую смену.', 'Начать смену'],
  paused: ['Перерыв без оплаты', 'Пауза', 'Велосипед на месте. Ужин продолжает остывать.', 'Продолжить'],
  lost: ['Заказ ждёт', 'Ещё попытка', 'Повторите этот двор. Оплата за предыдущие заказы и улучшения остаются с вами.', 'Повторить двор'],
  'level-complete': ['Заказ доставлен', 'Следующий адрес', 'Потратьте заработанное в мастерской или сразу берите следующий заказ.', 'В следующий двор'],
  won: ['Смена завершена', 'Утро не за горами', 'Шесть дворов позади. Дальше: зеркальные маршруты и быстрее собаки. Деньги и улучшения сохраняются.', 'Следующая смена'],
};
let current;
const game = new Game(canvas, input, (snapshot) => {
  current = snapshot;
  $('score').textContent = `${snapshot.collected ?? snapshot.score} / ${snapshot.totalItems ?? 3}`;
  $('best').textContent = snapshot.best;
  $('total-score').textContent = `${snapshot.score} посылок`;
  $('route').textContent = `Смена ${snapshot.shift ?? 1} / ${snapshot.level ?? 1} из ${snapshot.totalLevels ?? 6}`;
  $('route').title = snapshot.levelName || '';
  const seconds = Math.max(0, Math.ceil(snapshot.remaining ?? snapshot.timeLeft ?? 0));
  $('timer').textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  $('timer').classList.toggle('expired', seconds === 0);
  $('wallet').textContent = `${snapshot.wallet ?? 0} ₽`;
  const message = snapshot.message || 'Клиент просил не звонить. Домофон не работает.';
  if ($('message').textContent !== message) $('message').textContent = message;
  $('pause').disabled = !['running', 'paused'].includes(snapshot.status);
  $('pause').textContent = snapshot.status === 'paused' ? 'Продолжить' : 'Пауза';
  $('overlay').hidden = snapshot.status === 'running';
  const copy = labels[snapshot.status];
  if (copy) {
    $('overlay-kicker').textContent = copy[0];
    $('overlay-title').innerHTML = copy[1];
    $('overlay-text').textContent = copy[2];
    $('start').textContent = copy[3];
    if (snapshot.status === 'ready' && snapshot.resumed) {
      $('overlay-kicker').textContent = 'Заезд сохранён';
      $('start').textContent = 'Продолжить смену';
    }
    if (snapshot.status === 'lost') $('overlay-text').textContent = snapshot.message;
  }
  const betweenOrders = ['level-complete', 'won'].includes(snapshot.status);
  $('workshop').hidden = !betweenOrders;
  $('order-result').hidden = !betweenOrders;
  $('order-result').textContent = `За доставку: +${snapshot.deliveryReward ?? 0} ₽. Кошелёк: ${snapshot.wallet ?? 0} ₽`;
  for (const type of ['grip', 'bonus']) {
    const rank = snapshot.upgrades?.[type] ?? 0;
    const cost = snapshot.upgradeCosts?.[type] ?? 0;
    $(`${type}-rank`).textContent = `${rank} / 3`;
    $(`${type}-price`).textContent = rank >= 3 ? 'Установлено' : `${cost} ₽`;
    $(`upgrade-${type}`).disabled = !betweenOrders || rank >= 3 || (snapshot.wallet ?? 0) < cost;
  }
});
function activate() {
  game.start();
  canvas.focus({ preventScroll: true });
}
$('start').addEventListener('click', activate);
$('pause').addEventListener('click', () => game.togglePause());
$('restart').addEventListener('click', () => { game.restart(); canvas.focus({ preventScroll: true }); });
for (const type of ['grip', 'bonus']) {
  $(`upgrade-${type}`).addEventListener('click', () => game.buyUpgrade(type));
}
document.addEventListener('keydown', event => {
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName)) return;
  if (['level-complete', 'won'].includes(current?.status) && ['Digit1', 'Digit2'].includes(event.code)) {
    event.preventDefault();
    if (!event.repeat) game.buyUpgrade(event.code === 'Digit1' ? 'grip' : 'bonus');
  } else if (['Enter', 'Space'].includes(event.code) && current?.status !== 'running') {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!event.repeat) activate();
  } else if (event.code === 'Escape') {
    event.preventDefault();
    if (!event.repeat) game.togglePause();
  } else if (event.code === 'Enter' && current?.status === 'running') {
    // Avoid activating a focused menu button repeatedly while playing.
    event.preventDefault();
  }
}, true);
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
game.reducedMotion = motionQuery.matches;
motionQuery.addEventListener('change', event => { game.reducedMotion = event.matches; game.draw(); });
game.draw();
$('fullscreen').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.querySelector('.shell').requestFullscreen();
  } catch { $('message').textContent = 'Полный экран недоступен в этом браузере. Можно продолжить здесь.'; }
});
document.addEventListener('fullscreenchange', () => {
  $('fullscreen').textContent = document.fullscreenElement ? 'Оконный режим' : 'На весь экран';
});
