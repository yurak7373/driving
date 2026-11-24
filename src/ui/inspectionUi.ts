import type { SceneState } from "../scenes/sceneState";

import { byId, renewCanvas } from "./dom";

export function getInspectionUi() {
  const viewport = byId("viewport");
  const canvas = renewCanvas("scene");
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
