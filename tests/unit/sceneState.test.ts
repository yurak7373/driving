import { describe, expect, it } from "vitest";
import { actionForKey } from "../../src/input/sceneInput";
import { initialSceneState, sceneBounds, updateSceneState } from "../../src/scenes/sceneState";

describe("입력과 테스트 장면 상태", () => {
  it("방향키와 WASD를 같은 동작으로 변환하고 지원하지 않는 키를 무시한다", () => {
    expect(actionForKey("ArrowLeft")).toBe(actionForKey("KeyA"));
    expect(actionForKey("KeyW")).toBe("forward");
    expect(actionForKey("KeyC")).toBe("camera");
    expect(actionForKey("KeyP")).toBeUndefined();
  });

  it("이동 범위를 벗어나지 않고 이전 상태를 보존한다", () => {
    const edge = { ...initialSceneState, x: sceneBounds.x };
    expect(updateSceneState(edge, "right").x).toBe(sceneBounds.x);
    expect(updateSceneState(initialSceneState, "forward").z).toBe(-1);
    expect(initialSceneState.z).toBe(0);
  });
});
