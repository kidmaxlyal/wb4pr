// Axis-aligned solid collisions. Crossing checks use the previous position,
// so even a fast body cannot pass through a thin ledge in a physics step.
export function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function moveAndCollide(body, solids, dt) {
  const previousX = body.x;
  body.x += body.vx * dt;
  for (const solid of solids) {
    if (body.y >= solid.y + solid.h || body.y + body.h <= solid.y) continue;
    if (body.vx > 0 && previousX + body.w <= solid.x && body.x + body.w >= solid.x) {
      body.x = solid.x - body.w;
      body.vx = 0;
    } else if (body.vx < 0 && previousX >= solid.x + solid.w && body.x <= solid.x + solid.w) {
      body.x = solid.x + solid.w;
      body.vx = 0;
    }
  }
  const previousY = body.y;
  body.y += body.vy * dt;
  body.grounded = false;
  for (const solid of solids) {
    if (body.x >= solid.x + solid.w || body.x + body.w <= solid.x) continue;
    if (body.vy >= 0 && previousY + body.h <= solid.y + 0.01 && body.y + body.h >= solid.y) {
      body.y = solid.y - body.h;
      body.vy = 0;
      body.grounded = true;
    } else if (body.vy < 0 && previousY >= solid.y + solid.h - 0.01 && body.y <= solid.y + solid.h) {
      body.y = solid.y + solid.h;
      body.vy = 0;
    }
  }
}
