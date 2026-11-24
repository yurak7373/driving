import { Vector3 } from "three";
import { busViews, createBusCamera, type BusView } from "../camera/busCamera";
import { projectObjectBounds } from "../camera/inspectionCamera";
import { getViewport } from "../core/viewport";
import { createBusInspectionScene } from "../scenes/busInspectionScene";
import {
  initialBusPreview,
  updateBusPreview,
  type BusPreviewAction,
} from "../scenes/busPreviewState";
import {
  busConfig,
  liveryConfig,
  type BusLivery,
} from "../vehicles/bus/busConfig";
import { destinationText } from "./busDecals";
import { byId, renewCanvas } from "./dom";

export function startBusInspection() {
  const canvas = renewCanvas("bus-canvas");
  const viewport = byId("bus-viewport");
  const status = byId("bus-render-status");
  status.textContent = "3D 모델을 준비하는 중";
  let scene;
  try {
    scene = createBusInspectionScene(canvas);
  } catch (error) {
    console.error("버스 관찰 장면 초기화 실패", error);
    status.textContent =
      "버스 관찰 화면을 시작할 수 없습니다. WebGL 설정을 확인하세요.";
    return;
  }
  const { bus, renderer, bounds, scene: world } = scene;
  const { camera, controls, setView, resize, zoom } = createBusCamera(
    canvas,
    bounds,
  );
  const rail = byId("bus-controls");
  const paint = byId<HTMLSelectElement>("bus-livery");
  const steering = byId<HTMLInputElement>("bus-steering");
  const rolling = byId<HTMLInputElement>("bus-roll");
  const viewReadout = byId("bus-view");
  const steeringValue = byId("bus-steering-value");
  const rollValue = byId("bus-roll-value");
  const info = bus.inspect();
  byId("bus-name").textContent = busConfig.name;
  byId("bus-dimensions").textContent =
    `${busConfig.length.toFixed(1)} × ${busConfig.width.toFixed(1)} × ${busConfig.height.toFixed(1)} m`;
  byId("bus-wheelbase").textContent = `${busConfig.wheelbase.toFixed(1)} m`;
  byId("bus-wheels").textContent = `${info.wheels.length}개`;
  byId("bus-doors").textContent =
    `앞문 ${info.frontDoor ? "있음" : "없음"} · 중문 ${info.middleDoor ? "있음" : "없음"}`;
  byId("bus-parts").textContent = info.missing.length
    ? `누락: ${info.missing.join(", ")}`
    : "필수 부품 확인";
  let preview = initialBusPreview;
  let updatingCamera = false;
  let view: BusView | "free" = "diagonal";
  const direction = new Vector3();
  const subscriptions = new AbortController();
  const { signal } = subscriptions;
  paint.value = preview.livery;
  steering.min = String(-busConfig.visualSteeringDegrees);
  steering.max = String(busConfig.visualSteeringDegrees);
  steering.value = rolling.value = "0";
  steeringValue.textContent = rollValue.textContent = "0°";

  function render() {
    renderer.render(world, camera);
    const projected = projectObjectBounds(bounds, camera);
    canvas.dataset.cameraAspect = String(camera.aspect);
    canvas.dataset.cameraDirection = JSON.stringify(
      camera.getWorldDirection(direction).toArray(),
    );
    canvas.dataset.busProjection = JSON.stringify([
      projected.min.toArray(),
      projected.max.toArray(),
    ]);
    canvas.dataset.drawCalls = String(renderer.info.render.calls);
    canvas.dataset.paintColor = bus.getPaintColor();
    canvas.dataset.wheelPose = JSON.stringify(bus.getWheelPose());
  }

  function showView() {
    viewReadout.textContent =
      view === "free" ? "자유 관찰" : busViews[view].label;
    rail.querySelectorAll(".bus-presets [data-bus-view]").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.getAttribute("data-bus-view") === view),
      );
    });
  }

  function adjustCamera(update: () => void) {
    updatingCamera = true;
    update();
    updatingCamera = false;
    showView();
    render();
  }

  function onOrbitChange() {
    if (updatingCamera) return;
    view = "free";
    showView();
    render();
  }
  controls.addEventListener("change", onOrbitChange);

  function resizeViewport(initial = false) {
    const size = getViewport(
      viewport.clientWidth,
      viewport.clientHeight,
      window.devicePixelRatio,
    );
    renderer.setDrawingBufferSize(
      size.width,
      size.height,
      Math.min(1.75, size.pixelRatio),
    );
    adjustCamera(() => {
      if (initial) {
        camera.aspect = size.aspect;
        setView("diagonal");
      } else {
        resize(size.aspect);
      }
    });
  }

  function dispatch(action: BusPreviewAction) {
    preview = updateBusPreview(preview, action);
    bus.applyPose(preview.pose);
    bus.applyLivery(preview.livery);
    render();
  }

  rail.addEventListener(
    "click",
    (event) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest<HTMLButtonElement>("button");
      const next = button?.dataset.busView;
      if (next && Object.hasOwn(busViews, next)) {
        const preset = next as BusView;
        view = preset;
        adjustCamera(() => setView(preset));
      } else if (button?.dataset.zoom) {
        view = "free";
        adjustCamera(() => zoom(Number(button.dataset.zoom)));
      }
    },
    { signal },
  );

  paint.addEventListener(
    "change",
    () => {
      if (Object.hasOwn(liveryConfig, paint.value)) {
        dispatch({ type: "livery", value: paint.value as BusLivery });
      }
    },
    { signal },
  );
  steering.addEventListener(
    "input",
    () => {
      steeringValue.textContent = `${steering.value}°`;
      dispatch({
        type: "steering",
        value: (steering.valueAsNumber * Math.PI) / 180,
      });
    },
    { signal },
  );
  rolling.addEventListener(
    "input",
    () => {
      rollValue.textContent = `${rolling.value}°`;
      dispatch({
        type: "wheelRoll",
        value: (rolling.valueAsNumber * Math.PI) / 180,
      });
    },
    { signal },
  );

  resizeViewport(true);
  status.textContent = "WebGL 렌더링 중";
  const observer = new ResizeObserver(() => resizeViewport());
  observer.observe(viewport);
  void document.fonts
    .load("700 57px BusDisplay", destinationText.destination)
    .then(() => {
      if (!signal.aborted && scene.refreshDestinationFont()) render();
    })
    .catch(() => {
      // The same display is already drawn using the available fonts.
    });

  return () => {
    subscriptions.abort();
    observer.disconnect();
    controls.removeEventListener("change", onOrbitChange);
    controls.dispose();
    scene.dispose();
  };
}
