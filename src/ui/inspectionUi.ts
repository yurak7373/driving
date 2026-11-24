import type { SceneState } from "../scenes/sceneState";

function byId<T extends HTMLElement>(id: string) {
  const element = document.getElementById(id);
  if (!element) throw new Error(`필수 화면 요소가 없습니다: ${id}`);
  return element as T;
}

export function getInspectionUi() {
  const viewport = byId("viewport");
  const canvas = byId<HTMLCanvasElement>("scene");
  const controls = byId("controls");
  const status = byId("render-status");
  const view = byId("view-label");
  const coordinates = byId("coordinates");

  return {
    viewport,
    canvas,
    controls,
    setStatus(state: "ready" | "error", message: string) {
      viewport.dataset.render = state;
      status.textContent = message;
    },
    updateReadout(state: SceneState) {
      view.textContent = state.view === "orbit" ? "사선" : "위에서 보기";
      coordinates.textContent = `${state.x} / ${state.z}`;
    },
  };
}
