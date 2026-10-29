export const LEVELS = [
  {
    name: 'Двор № 1', subtitle: 'Клиент просил не звонить. Домофон тоже.',
    platforms: [
      { x: 0, y: 550, w: 250, h: 90 }, { x: 315, y: 465, w: 180, h: 25 },
      { x: 555, y: 395, w: 180, h: 25 }, { x: 790, y: 465, w: 160, h: 25 },
      { x: 1010, y: 550, w: 190, h: 90 },
    ],
    items: [{ x: 390, y: 425 }, { x: 625, y: 355 }, { x: 915, y: 425 }],
    hazards: [{ x: 250, y: 610, w: 760, h: 70 }],
    finish: { x: 1115, y: 438, w: 65, h: 112 }, spawn: { x: 75, y: 482 },
  },
  {
    name: 'Двор № 2 · Обходной путь', subtitle: 'Подъезд наверху слева. Сначала направо, потом назад — навигатор уверен.',
    platforms: [
      { x: 0, y: 550, w: 260, h: 90 }, { x: 320, y: 465, w: 190, h: 25 },
      { x: 575, y: 390, w: 200, h: 25 }, { x: 835, y: 290, w: 200, h: 25 },
      { x: 575, y: 190, w: 200, h: 25 },
    ],
    items: [{ x: 400, y: 425 }, { x: 650, y: 350 }, { x: 930, y: 250 }],
    hazards: [{ x: 260, y: 610, w: 940, h: 70 }],
    finish: { x: 590, y: 78, w: 65, h: 112 }, spawn: { x: 65, y: 482 },
  },
  {
    name: 'Двор № 3 · Последняя миля', subtitle: 'Узкие опоры, длинная смена. Перед посадкой можно отпустить газ.',
    platforms: [
      { x: 0, y: 550, w: 170, h: 90 }, { x: 230, y: 465, w: 120, h: 25 },
      { x: 420, y: 380, w: 130, h: 25 }, { x: 620, y: 465, w: 100, h: 25 },
      { x: 790, y: 370, w: 115, h: 25 }, { x: 950, y: 460, w: 90, h: 25 },
      { x: 1090, y: 550, w: 110, h: 90 },
    ],
    items: [{ x: 270, y: 425 }, { x: 650, y: 425 }, { x: 980, y: 420 }],
    hazards: [{ x: 170, y: 610, w: 920, h: 70 }],
    finish: { x: 1120, y: 438, w: 65, h: 112 }, spawn: { x: 45, y: 482 },
  },
  {
    name: 'Двор № 4 · Обратный адрес', subtitle: 'Адрес справа? Нет, весь двор налево. Дворнягу лучше перепрыгнуть.',
    platforms: [
      { x: 950, y: 550, w: 250, h: 90 }, { x: 705, y: 465, w: 180, h: 25 },
      { x: 465, y: 395, w: 180, h: 25 }, { x: 250, y: 465, w: 160, h: 25 },
      { x: 0, y: 550, w: 190, h: 90 },
    ],
    items: [{ x: 775, y: 425 }, { x: 535, y: 355 }, { x: 315, y: 425 }],
    hazards: [{ x: 190, y: 610, w: 760, h: 70 }],
    finish: { x: 15, y: 438, w: 65, h: 112 }, spawn: { x: 1100, y: 482 },
    dogs: [{ baseX: 980, y: 520, range: 28, speed: 0.8, phase: 0 }],
  },
  {
    name: 'Двор № 5 · На крышу без лифта', subtitle: 'Пять этажей пешком отменяются. Тормоз S / ↓ поможет с посадкой.',
    platforms: [
      { x: 0, y: 550, w: 190, h: 90 }, { x: 250, y: 440, w: 160, h: 25 },
      { x: 475, y: 340, w: 160, h: 25 }, { x: 700, y: 250, w: 150, h: 25 },
      { x: 880, y: 350, w: 120, h: 25 }, { x: 1060, y: 470, w: 140, h: 170 },
    ],
    items: [{ x: 315, y: 400 }, { x: 760, y: 210 }, { x: 1120, y: 430 }],
    hazards: [{ x: 190, y: 610, w: 870, h: 70 }],
    finish: { x: 1120, y: 358, w: 65, h: 112 }, spawn: { x: 25, y: 482 },
    dogs: [{ baseX: 1090, y: 440, range: 18, speed: 1, phase: 0 }],
  },
  {
    name: 'Двор № 6 · Ночная пересменка', subtitle: 'Последний адрес. Перепрыгните охрану, соберите чаевые, решите — ещё смену?',
    platforms: [
      { x: 0, y: 550, w: 170, h: 90 }, { x: 230, y: 450, w: 110, h: 25 },
      { x: 400, y: 350, w: 130, h: 25 }, { x: 590, y: 440, w: 115, h: 25 },
      { x: 765, y: 330, w: 105, h: 25 }, { x: 925, y: 410, w: 115, h: 25 },
      { x: 1085, y: 550, w: 115, h: 90 },
    ],
    items: [{ x: 270, y: 410 }, { x: 630, y: 400 }, { x: 970, y: 370 }],
    hazards: [{ x: 170, y: 610, w: 915, h: 70 }],
    finish: { x: 1120, y: 438, w: 65, h: 112 }, spawn: { x: 35, y: 482 },
    dogs: [{ baseX: 435, y: 320, range: 18, speed: 0.9, phase: 1 }],
  },
];

// Tips are optional detours; parcel collection alone always unlocks the door.
// Every coin is reachable by the same jump as its supporting platform.
for (const [index, level] of LEVELS.entries()) {
  level.orderSeconds = [45, 65, 60, 65, 65, 70][index];
  const home = level.platforms[0];
  const middle = level.platforms[Math.min(2, level.platforms.length - 1)];
  level.coins = [
    { x: index === 3 ? 1165 : 8, y: home.y - 38 },
    { x: middle.x + middle.w / 2 - 11, y: middle.y - 125 },
  ];
  level.dogs ??= [];
}
