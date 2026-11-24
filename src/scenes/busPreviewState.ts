import type { BusLivery } from "../vehicles/bus/busConfig";
import type { BusVisualPose } from "../vehicles/bus/busVisual";

export interface BusPreviewState {
  livery: BusLivery;
  pose: BusVisualPose;
}

export type BusPreviewAction =
  | { type: "livery"; value: BusLivery }
  | { type: "steering" | "wheelRoll"; value: number };

export const initialBusPreview: BusPreviewState = {
  livery: "green",
  pose: { position: [0, 0, 0], rotation: [0, 0, 0], steering: 0, wheelRoll: 0 },
};

export function updateBusPreview(
  state: BusPreviewState,
  action: BusPreviewAction,
): BusPreviewState {
  if (action.type === "livery") return { ...state, livery: action.value };
  return { ...state, pose: { ...state.pose, [action.type]: action.value } };
}
