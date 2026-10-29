const KEYS = new Map([
  ['ArrowLeft', 'left'], ['KeyA', 'left'],
  ['ArrowRight', 'right'], ['KeyD', 'right'],
  ['Space', 'jump'], ['KeyW', 'jump'],
  ['ArrowDown', 'brake'], ['KeyS', 'brake'],
]);

export class Input {
  constructor(root = document) {
    this.root = root;
    this.keys = new Set();
    this.pointers = new Map();
    this.jumpQueued = false;
    this.active = false;
    this.listeners = [];
    const listen = (target, event, handler, options) => {
      target.addEventListener(event, handler, options);
      this.listeners.push(() => target.removeEventListener(event, handler, options));
    };
    listen(root, 'keydown', event => {
      const control = KEYS.get(event.code);
      if (!control || !this.active || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName)) return;
      event.preventDefault();
      if (control === 'jump' && !event.repeat && !this.keys.has(event.code)) this.jumpQueued = true;
      this.keys.add(event.code);
    });
    listen(root, 'keyup', event => {
      if (KEYS.has(event.code)) {
        if (this.active) event.preventDefault();
        this.keys.delete(event.code);
      }
    });
    for (const button of root.querySelectorAll('[data-control]')) {
      listen(button, 'pointerdown', event => {
        event.preventDefault();
        if (!this.active) return;
        button.setPointerCapture?.(event.pointerId);
        const control = button.dataset.control;
        this.pointers.set(event.pointerId, control);
        if (control === 'jump') this.jumpQueued = true;
        button.classList.add('pressed');
      });
      const release = event => {
        this.pointers.delete(event.pointerId);
        if (![...this.pointers.values()].includes(button.dataset.control)) button.classList.remove('pressed');
      };
      listen(button, 'pointerup', release);
      listen(button, 'pointercancel', release);
      listen(button, 'lostpointercapture', release);
      listen(button, 'contextmenu', event => event.preventDefault());
    }
    if (typeof window !== 'undefined') listen(window, 'blur', () => this.clear());
  }

  held(control) {
    return [...this.keys].some(code => KEYS.get(code) === control) || [...this.pointers.values()].includes(control);
  }

  get axis() { return Number(this.held('right')) - Number(this.held('left')); }
  get brake() { return this.held('brake'); }

  consumeJump() {
    const jump = this.jumpQueued;
    this.jumpQueued = false;
    return jump;
  }

  clear() {
    this.keys.clear();
    this.pointers.clear();
    this.jumpQueued = false;
    for (const button of this.root.querySelectorAll('[data-control]')) button.classList.remove('pressed');
  }

  destroy() { this.listeners.forEach(remove => remove()); this.clear(); }
}
