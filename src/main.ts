import "./style.css";
import { Box3, Vector3 } from "three";
import { projectObjectBounds, setCameraView } from "./camera/inspectionCamera";
import { getViewport } from "./core/viewport";
import { connectSceneInput } from "./input/sceneInput";
import { createInspectionScene } from "./scenes/inspectionScene";
import {
  initialSceneState,
  sceneBounds,
  updateSceneState,
} from "./scenes/sceneState";
import { getInspectionUi } from "./ui/inspectionUi";

function startInspection() {
  const ui = getInspectionUi();
  let inspection: ReturnType<typeof createInspectionScene>;
  try {
    inspection = createInspectionScene(ui.canvas);
  } catch (error) {
    console.error("WebGL 초기화 실패", error);
    ui.setStatus(
      "error",
      "WebGL 2를 사용할 수 없습니다. 브라우저의 그래픽 설정을 확인하세요.",
    );
    return;
  }

  const { renderer, scene, camera, marker } = inspection;
  let state = initialSceneState;
  const markerBounds = new Box3().setFromObject(marker);
  const movementBounds = markerBounds
    .clone()
    .expandByVector(new Vector3(sceneBounds.x, 0, sceneBounds.z));
  const renderedMarkerBounds = new Box3();
  const cameraDirection = new Vector3();

  function render() {
    marker.position.set(state.x, 0, state.z);
    renderer.render(scene, camera);
    ui.canvas.dataset.drawCalls = String(renderer.info.render.calls);
    ui.canvas.dataset.cameraAspect = String(camera.aspect);
    const projected = projectObjectBounds(
      renderedMarkerBounds.setFromObject(marker),
      camera,
    );
    ui.canvas.dataset.markerProjection = JSON.stringify([
      projected.min.toArray(),
      projected.max.toArray(),
    ]);
    ui.canvas.dataset.cameraDirectionY = String(
      camera.getWorldDirection(cameraDirection).y,
    );
    ui.updateReadout(state);
  }

  function resize() {
    const viewport = getViewport(
      ui.viewport.clientWidth,
      ui.viewport.clientHeight,
      window.devicePixelRatio,
    );
    renderer.setPixelRatio(viewport.pixelRatio);
    renderer.setSize(viewport.width, viewport.height, false);
    camera.aspect = viewport.aspect;
    setCameraView(camera, state.view, movementBounds);
    render();
  }

  resize();
  ui.setStatus("ready", "WebGL 렌더링 중");
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(ui.viewport);
  window.addEventListener("resize", resize);
  const disconnectInput = connectSceneInput(ui.controls, (action) => {
    const previousView = state.view;
    state = updateSceneState(state, action);
    if (state.view !== previousView)
      setCameraView(camera, state.view, movementBounds);
    render();
  });

  import.meta.hot?.dispose(() => {
    disconnectInput();
    resizeObserver.disconnect();
    window.removeEventListener("resize", resize);
    inspection.dispose();
  });
}

startInspection();
