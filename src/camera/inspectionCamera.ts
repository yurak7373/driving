import { PerspectiveCamera } from "three";
import type { CameraView } from "../scenes/sceneState";

export function setCameraView(camera: PerspectiveCamera, view: CameraView) {
  if (view === "top") camera.position.set(0, 18, 0.01);
  else camera.position.set(8.5, 7.2, 11);

  camera.lookAt(0, 0, 0);
}
