export function byId<T extends HTMLElement>(id: string) {
  const element = document.getElementById(id);
  if (!element) throw new Error(`필수 화면 요소가 없습니다: ${id}`);
  return element as T;
}

export function renewCanvas(id: string) {
  const previous = byId<HTMLCanvasElement>(id);
  const next = document.createElement("canvas");
  for (const name of ["id", "class", "role", "aria-label"]) {
    const value = previous.getAttribute(name);
    if (value !== null) next.setAttribute(name, value);
  }
  previous.replaceWith(next);
  return next;
}
