import { Game } from './Game.js';
import { Input } from './input.js';

const $ = (id) => document.getElementById(id);
const canvas = $('game');
const input = new Input(document);
const labels = {
  ready: ['Вечерняя смена', 'До двери', 'Заберите три посылки и найдите зелёный подъезд. Клиент уже спускается. С прошлого четверга.', 'Начать смену'],
  paused: ['Перерыв без оплаты', 'Пауза', 'Велосипед на месте. Ужин продолжает остывать.', 'Продолжить'],
  lost: ['Заказ отменён', 'Не довезли', 'Асфальт оказался убедительнее. Начнём смену заново?', 'Попробовать снова'],
  'level-complete': ['Заказ доставлен', 'Следующий адрес', 'Дальше дорога хуже. Проверяйте, где приземлитесь.', 'В следующий двор'],
  won: ['Смена завершена', 'Всё доставлено', 'Три двора позади. Чаевые: «Спасибо, держитесь».', 'Новая смена'],
};
let current;
const game = new Game(canvas, input, (snapshot) => {
  current = snapshot;
  $('score').textContent = `${snapshot.collected ?? snapshot.score} / ${snapshot.totalItems ?? 3}`;
  $('best').textContent = snapshot.best;
  $('total-score').textContent = snapshot.score;
  $('route').textContent = `Двор ${snapshot.level ?? 1} из ${snapshot.totalLevels ?? 3}`;
  $('message').textContent = snapshot.message || 'Клиент просил не звонить. Домофон не работает.';
  $('pause').disabled = !['running', 'paused'].includes(snapshot.status);
  $('pause').textContent = snapshot.status === 'paused' ? 'Продолжить' : 'Пауза';
  $('overlay').hidden = snapshot.status === 'running';
  const copy = labels[snapshot.status];
  if (copy) {
    $('overlay-kicker').textContent = copy[0];
    $('overlay-title').innerHTML = copy[1];
    $('overlay-text').textContent = copy[2];
    $('start').textContent = copy[3];
  }
});
function activate() {
  if (['lost', 'won'].includes(current?.status)) game.restart();
  else game.start();
  canvas.focus({ preventScroll: true });
}
$('start').addEventListener('click', activate);
$('pause').addEventListener('click', () => game.togglePause());
$('restart').addEventListener('click', () => { game.restart(); canvas.focus({ preventScroll: true }); });
document.addEventListener('keydown', event => {
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName)) return;
  if (['Enter', 'Space'].includes(event.code) && current?.status !== 'running') {
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
