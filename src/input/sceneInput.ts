export const sceneActions = ["left", "right", "forward", "back", "camera", "reset"] as const;
export type SceneAction = (typeof sceneActions)[number];

const keyActions = new Map<string, SceneAction>([
  ["ArrowLeft", "left"], ["KeyA", "left"],
  ["ArrowRight", "right"], ["KeyD", "right"],
  ["ArrowUp", "forward"], ["KeyW", "forward"],
  ["ArrowDown", "back"], ["KeyS", "back"],
  ["KeyC", "camera"],
]);

export function actionForKey(code: string): SceneAction | undefined {
  return keyActions.get(code);
}

export function connectSceneInput(controls: HTMLElement, dispatch: (action: SceneAction) => void) {
  const subscriptions = new AbortController();
  const { signal } = subscriptions;

  controls.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;

    const button = event.target.closest<HTMLButtonElement>("button[data-action]");
    const action = sceneActions.find((item) => item === button?.dataset.action);
    if (action) dispatch(action);
  }, { signal });

  window.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    if (event.target instanceof HTMLElement &&
      (event.target.isContentEditable || event.target.closest("input, textarea, select"))) return;

    const action = actionForKey(event.code);
    if (!action) return;

    event.preventDefault();
    if (action !== "camera" || !event.repeat) dispatch(action);
  }, { signal });

  return () => subscriptions.abort();
}
