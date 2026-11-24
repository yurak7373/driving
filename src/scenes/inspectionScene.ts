import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  GridHelper,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  WebGLRenderer,
} from "three";

export function createInspectionScene(canvas: HTMLCanvasElement) {
  const renderer = new WebGLRenderer({ canvas, antialias: true });
  const scene = new Scene();
  const camera = new PerspectiveCamera(48, 1, 0.1, 70);

  scene.background = new Color("#22394e");
  scene.add(new AmbientLight("#eef5ff", 1.3));
  const sun = new DirectionalLight("#fff1d9", 2.2);
  sun.position.set(-4, 8, 5);
  scene.add(sun);

  const ground = new Mesh(
    new PlaneGeometry(25, 25),
    new MeshStandardMaterial({ color: "#344c61", roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const grid = new GridHelper(20, 20, "#637e95", "#466278");
  grid.position.y = 0.012;
  scene.add(grid);

  const strips = new Group();
  const stripMaterial = new MeshStandardMaterial({ color: "#9eb9ca" });
  const horizontalStrip = new BoxGeometry(8.5, 0.018, 0.055);
  const verticalStrip = new BoxGeometry(0.055, 0.018, 12.5);
  for (const side of [-1, 1]) {
    const horizontal = new Mesh(horizontalStrip, stripMaterial);
    horizontal.position.set(0, 0.023, side * 6.25);
    const vertical = new Mesh(verticalStrip, stripMaterial);
    vertical.position.set(side * 4.25, 0.023, 0);
    strips.add(horizontal, vertical);
  }
  scene.add(strips);

  const marker = new Group();
  const body = new Mesh(
    new BoxGeometry(1.05, 0.68, 1.6),
    new MeshStandardMaterial({ color: "#eaad52", roughness: 0.6 }),
  );
  body.position.y = 0.46;
  const base = new Mesh(
    new BoxGeometry(1.18, 0.16, 1.73),
    new MeshStandardMaterial({ color: "#182636" }),
  );
  base.position.y = 0.09;
  marker.add(body, base);
  scene.add(marker);

  return {
    renderer,
    scene,
    camera,
    marker,
    dispose() {
      renderer.dispose();
      grid.dispose();
      ground.geometry.dispose();
      ground.material.dispose();
      horizontalStrip.dispose();
      verticalStrip.dispose();
      stripMaterial.dispose();
      body.geometry.dispose();
      body.material.dispose();
      base.geometry.dispose();
      base.material.dispose();
    },
  };
}
