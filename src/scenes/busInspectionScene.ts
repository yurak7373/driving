import {
  Box3,
  CircleGeometry,
  Color,
  DirectionalLight,
  GridHelper,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from "three";
import { createBusVisual, type BusVisual } from "../vehicles/bus/busVisual";
import { createBusDecals, destinationText } from "../ui/busDecals";

export function createBusInspectionScene(canvas: HTMLCanvasElement) {
  const renderer = new WebGLRenderer({ canvas, antialias: true });
  const scene = new Scene();
  scene.background = new Color("#d7e6e2");
  const fill = new HemisphereLight("#ecfbff", "#adbbb3", 2.3);
  const key = new DirectionalLight("#fff8e8", 2.7);
  key.position.set(5, 11, 7);
  const rim = new DirectionalLight("#e2f1ff", 1.4);
  rim.position.set(-7, 6, -8);
  scene.add(fill, key, rim);

  const deck = new Mesh(
    new CircleGeometry(62, 72),
    new MeshBasicMaterial({ color: "#d7e6e2" }),
  );
  deck.rotation.x = -Math.PI / 2;
  deck.position.y = -0.022;
  const grid = new GridHelper(34, 34, "#97aba5", "#b8cbc6");
  grid.position.y = -0.017;
  const plinth = new Mesh(
    new CircleGeometry(6.65, 64),
    new MeshBasicMaterial({ color: "#c9d9d4" }),
  );
  plinth.rotation.x = -Math.PI / 2;
  plinth.position.y = -0.01;

  const contact = new Mesh(
    new PlaneGeometry(5, 14),
    new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexShader:
        "varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader:
        "varying vec2 vUv; void main(){vec2 p=abs(vUv*2.-1.); float a=(1.-smoothstep(.27,1.,p.x))*(1.-smoothstep(.68,1.,p.y)); gl_FragColor=vec4(.12,.21,.20,a*.35);}",
    }),
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = -0.005;
  scene.add(deck, grid, plinth, contact);

  const decals = createBusDecals();
  let model = createBusVisual(decals.maps);
  scene.add(model.root);
  const bounds = new Box3().setFromObject(model.root);
  let disposed = false;
  function replaceModel(next: BusVisual) {
    if (disposed)
      throw new Error("종료된 관찰 장면에는 차량을 추가할 수 없습니다.");
    if (model === next) return;
    model.dispose();
    model = next;
    scene.add(next.root);
    bounds.setFromObject(next.root);
  }

  return {
    renderer,
    scene,
    bounds,
    replaceModel,
    get bus() {
      return model;
    },
    refreshDestinationFont: () =>
      decals.setDestination(
        destinationText.route,
        destinationText.destination,
        true,
      ),
    dispose() {
      if (disposed) return;
      disposed = true;
      model.dispose();
      for (const mesh of [deck, plinth, contact]) {
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
      grid.dispose();
      decals.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
