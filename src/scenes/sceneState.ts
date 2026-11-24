import type { SceneAction } from "../input/sceneInput";

export type CameraView = "orbit" | "top";
export interface SceneState {
  readonly x: number;
  readonly z: number;
  readonly view: CameraView;
}

export const sceneBounds = { x: 4, z: 6 } as const;
export const initialSceneState: SceneState = { x: 0, z: 0, view: "orbit" };

const movement = {
  left: [-1, 0],
  right: [1, 0],
  forward: [0, -1],
  back: [0, 1],
} as const;

export function updateSceneState(state: SceneState, action: SceneAction): SceneState {
  if (action === "reset") return initialSceneState;
  if (action === "camera") {
    return { ...state, view: state.view === "orbit" ? "top" : "orbit" };
  }

  const [dx, dz] = movement[action];
  return {
    ...state,
    x: Math.max(-sceneBounds.x, Math.min(sceneBounds.x, state.x + dx)),
    z: Math.max(-sceneBounds.z, Math.min(sceneBounds.z, state.z + dz)),
  };
}
