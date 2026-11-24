import { PerspectiveCamera, Vector3 } from "three";
import { expect, it } from "vitest";
import { setCameraView } from "../../src/camera/inspectionCamera";
import { actionForKey } from "../../src/input/sceneInput";
import { initialSceneState, updateSceneState } from "../../src/scenes/sceneState";

it("입력으로 시점을 전환한 뒤 초기화하면 원래 카메라 위치와 상태로 돌아온다", () => {
  const camera = new PerspectiveCamera(48);
  setCameraView(camera, initialSceneState.view);
  const start = camera.position.clone();
  const switchView = actionForKey("KeyC");
  if (!switchView) throw new Error("시점 전환 키가 등록되지 않았습니다");

  const moved = updateSceneState(initialSceneState, "right");
  const overhead = updateSceneState(moved, switchView);
  setCameraView(camera, overhead.view);
  expect(camera.position.y).toBeGreaterThan(start.y);
  expect(camera.getWorldDirection(new Vector3()).y).toBeLessThan(-0.99);
  expect(overhead.x).toBe(1);

  const reset = updateSceneState(overhead, "reset");
  setCameraView(camera, reset.view);
  expect(camera.position.equals(start)).toBe(true);
  expect(reset).toEqual(initialSceneState);
});
