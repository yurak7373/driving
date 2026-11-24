import { CanvasTexture, SRGBColorSpace } from "three";

export const destinationText = { route: "101", destination: "해안공원" };

function createDecal(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("표시기 텍스처를 만들 수 없습니다.");
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return { context, texture };
}

export function createBusDecals() {
  const { context: led, texture: destination } = createDecal(512, 100);
  const { context: number, texture: plate } = createDecal(256, 64);
  const { context: badge, texture: fleet } = createDecal(256, 64);
  let current = "";
  let disposed = false;

  function setDestination(route: string, label: string, fontLoaded = false) {
    const key = JSON.stringify([route, label, fontLoaded]);
    if (disposed || current === key) return false;
    current = key;
    led.fillStyle = "#111917";
    led.fillRect(0, 0, 512, 100);
    led.fillStyle = "#394235";
    for (let y = 4; y < 100; y += 6) {
      for (let x = 5; x < 512; x += 6) led.fillRect(x, y, 1, 1);
    }
    led.textBaseline = "middle";
    led.fillStyle = "#ffcc63";
    led.font = "700 68px BusDisplay, monospace";
    led.fillText(route, 21, 51, 144);
    led.fillStyle = "#68774c";
    led.fillRect(178, 19, 2, 62);
    led.fillStyle = "#eef6c2";
    led.font = '700 57px BusDisplay, "Noto Sans KR", sans-serif';
    led.fillText(label, 202, 52, 292);
    destination.needsUpdate = true;
    return true;
  }

  number.fillStyle = "#f9e395";
  number.fillRect(0, 0, 256, 64);
  number.strokeStyle = "#483d28";
  number.strokeRect(3, 3, 250, 58);
  number.fillStyle = "#272516";
  number.font = "bold 38px sans-serif";
  number.textAlign = "center";
  number.textBaseline = "middle";
  number.fillText("HC 6101", 128, 33);
  badge.fillStyle = "#f3f3ed";
  badge.font = "bold 38px sans-serif";
  badge.textAlign = "center";
  badge.textBaseline = "middle";
  badge.fillText("HC  /  6101", 128, 32);
  plate.needsUpdate = true;
  fleet.needsUpdate = true;
  setDestination(destinationText.route, destinationText.destination);

  return {
    maps: { destination, plate, fleet },
    setDestination,
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const texture of [destination, plate, fleet]) texture.dispose();
    },
  };
}
