import { ExtrudeGeometry, Group, Mesh, PlaneGeometry, Shape } from "three";
import { busConfig, frontAxleZ, rearAxleZ } from "./busConfig";
import type { BusMaterials } from "./busMaterials";
import type { BusParts } from "./busParts";

const sideEnd = 5.24;
const frontDoor = [3.72, 5.12] as const;
const middleDoor = [-1.37, 0.05] as const;

export function addBusSides(root: Group, parts: BusParts, m: BusMaterials) {
  const halfWidth = busConfig.width / 2;
  const wheelOpening = 0.59;

  for (const side of [-1, 1]) {
    const wall = new Group();
    wall.name = side === 1 ? "RightBody" : "LeftBody";
    root.add(wall);
    const shellX = side * (halfWidth - 0.04);
    const outlineX = side * (halfWidth - 0.014);

    function panel(
      name: string,
      start: number,
      end: number,
      y: number,
      height: number,
      mat = m.white,
    ) {
      parts.box(
        wall,
        name,
        mat,
        [0.077, height, end - start],
        [shellX, y, (start + end) / 2],
      );
    }

    function wheelPanel(centers: number[], start: number, end: number) {
      const shape = new Shape();
      shape.moveTo(start, 0.43);
      const contour = (center: number, radius: number) => {
        const angle = Math.asin((0.43 - busConfig.tireRadius) / radius);
        return Array.from({ length: 25 }, (_, i) => {
          const a = Math.PI - angle - ((Math.PI - 2 * angle) * i) / 24;
          return [
            center + radius * Math.cos(a),
            busConfig.tireRadius + radius * Math.sin(a),
          ] as const;
        });
      };
      for (const center of centers) {
        for (const [z, y] of contour(center, wheelOpening)) shape.lineTo(z, y);
        const trim = new Shape();
        const outer = contour(center, wheelOpening + 0.048);
        trim.moveTo(...outer[0]);
        for (const point of [
          ...outer.slice(1),
          ...contour(center, wheelOpening).reverse(),
        ])
          trim.lineTo(...point);
        trim.closePath();
        addSideShape("WheelArch", trim, m.dark, 0.025, outlineX + 0.0125);
      }
      shape.lineTo(end, 0.43);
      shape.lineTo(end, 1.39);
      shape.lineTo(start, 1.39);
      shape.closePath();
      addSideShape("LowerSidePanel", shape, m.paint, 0.073, shellX + 0.0365);
    }

    function addSideShape(
      name: string,
      shape: Shape,
      material: BusMaterials["white"],
      depth: number,
      x: number,
    ) {
      const mesh = new Mesh(
        new ExtrudeGeometry(shape, { depth, bevelEnabled: false }),
        material,
      );
      mesh.name = name;
      mesh.rotation.y = -Math.PI / 2;
      mesh.position.x = x;
      wall.add(mesh);
    }

    function upperBay(start: number, end: number, name: string) {
      panel("PaintBelt", start, end, 1.46, 0.14, m.paint);
      panel("BeltTrim", start, end, 1.536, 0.022, m.accent);
      panel("WindowSill", start, end, 1.578, 0.075, m.dark);
      panel("Header", start, end, 2.773, 0.146);
      panel("WindowHeader", start, end, 2.677, 0.052, m.dark);
      for (const z of [start + 0.033, end - 0.033]) {
        parts.box(
          wall,
          "WindowPost",
          m.dark,
          [0.077, 1.11, 0.066],
          [shellX, 2.127, z],
        );
      }
      const pane = new Mesh(
        new PlaneGeometry(end - start - 0.124, 1.04),
        m.glass,
      );
      pane.name = name;
      pane.rotation.y = Math.PI / 2;
      pane.position.set(outlineX, 2.138, (start + end) / 2);
      wall.add(pane);
      parts.box(
        wall,
        "WindowDivider",
        m.dark,
        [0.024, 0.023, end - start - 0.099],
        [outlineX + side * 0.005, 2.46, (start + end) / 2],
      );
    }

    if (side === -1) {
      wheelPanel([rearAxleZ, frontAxleZ], -sideEnd, sideEnd);
      const stops = [-sideEnd, -3.68, -2.04, -0.4, 1.24, 2.88, 4.04, sideEnd];
      for (let i = 0; i < stops.length - 1; i++) {
        upperBay(
          stops[i],
          stops[i + 1],
          i === stops.length - 2 ? "Window_Driver" : `Window_L_${i + 1}`,
        );
      }
      parts.box(
        wall,
        "FuelCap",
        m.dark,
        [0.008, 0.17, 0.19],
        [side * (halfWidth + 0.002), 1.19, 0.93],
        0.004,
      );
    } else {
      wheelPanel([rearAxleZ], -sideEnd, middleDoor[0]);
      wheelPanel([frontAxleZ], middleDoor[1], frontDoor[0]);
      wheelPanel([], frontDoor[1], sideEnd);
      for (const [i, [start, end]] of [
        [-sideEnd, -3.58],
        [-3.58, middleDoor[0]],
        [middleDoor[1], 1.82],
        [1.82, frontDoor[0]],
      ].entries())
        upperBay(start, end, `Window_R_${i + 1}`);
      addDoor("FrontDoor", frontDoor);
      addDoor("MiddleDoor", middleDoor);
      parts.box(
        wall,
        "FrontDoorCornerPost",
        m.white,
        [0.08, 2.34, sideEnd - frontDoor[1]],
        [shellX, 1.685, (sideEnd + frontDoor[1]) / 2],
      );
      parts.box(
        wall,
        "SideIndicator",
        m.amber,
        [0.027, 0.091, 0.22],
        [halfWidth, 1.2, 2.16],
        0.01,
      );
    }

    const detailX = side * (halfWidth + 0.001);
    parts.box(
      wall,
      "AccessPanelSeam",
      m.dark,
      [0.014, 0.49, 1.28],
      [detailX, 0.88, side === 1 ? 1.25 : 0.2],
      0.007,
    );
    parts.box(
      wall,
      "AccessPanel",
      m.paint,
      [0.014, 0.45, 1.24],
      [detailX + side * 0.009, 0.88, side === 1 ? 1.25 : 0.2],
      0.007,
    );
    parts.box(
      wall,
      "AccessLatch",
      m.dark,
      [0.016, 0.035, 0.17],
      [detailX + side * 0.022, 1.01, side === 1 ? 1.25 : 0.2],
    );
    parts.box(
      wall,
      "EngineVentFrame",
      m.dark,
      [0.017, 0.48, 1.38],
      [detailX, 1.03, -4.4],
      0.008,
    );
    for (let i = 0; i < 8; i++) {
      parts.box(
        wall,
        "EngineVentSlat",
        m.alloy,
        [0.015, 0.014, 1.29],
        [detailX + side * 0.009, 0.835 + i * 0.052, -4.4],
      );
    }

    function addDoor(name: string, [start, end]: readonly [number, number]) {
      const door = new Group();
      door.name = name;
      door.position.set(halfWidth - 0.032, 0.45, (start + end) / 2);
      wall.add(door);
      const width = end - start;
      for (const sign of [-1, 1]) {
        parts.box(
          door,
          "DoorJamb",
          m.dark,
          [0.09, 2.33, 0.065],
          [0, 1.165, sign * (width / 2 - 0.033)],
        );
        const leaf = new Group();
        leaf.name = sign < 0 ? "LeafRearPivot" : "LeafFrontPivot";
        leaf.position.z = sign * (width / 2 - 0.067);
        door.add(leaf);
        const leafWidth = width / 2 - 0.077;
        const leafCenter = (-sign * leafWidth) / 2;
        parts.box(
          leaf,
          "DoorLower",
          m.paint,
          [0.039, 0.65, leafWidth],
          [0, 0.37, leafCenter],
          0.008,
        );
        parts.box(
          leaf,
          "DoorSash",
          m.dark,
          [0.04, 0.086, leafWidth],
          [0, 0.754, leafCenter],
        );
        parts.box(
          leaf,
          "DoorTop",
          m.dark,
          [0.04, 0.09, leafWidth],
          [0, 2.14, leafCenter],
        );
        parts.box(leaf, "DoorStile", m.dark, [0.04, 1.34, 0.048], [0, 1.45, 0]);
        parts.box(
          leaf,
          "DoorStile",
          m.dark,
          [0.04, 1.34, 0.048],
          [0, 1.45, -sign * (leafWidth - 0.023)],
        );
        const doorGlass = new Mesh(
          new PlaneGeometry(leafWidth - 0.087, 1.31),
          m.glass,
        );
        doorGlass.name = "DoorGlass";
        doorGlass.rotation.y = Math.PI / 2;
        doorGlass.position.set(0.005, 1.45, leafCenter);
        leaf.add(doorGlass);
      }
      parts.box(
        door,
        "DoorSill",
        m.alloy,
        [0.22, 0.075, width],
        [-0.052, 0.02, 0],
      );
      parts.box(
        door,
        "DoorLintel",
        m.white,
        [0.084, 0.17, width],
        [0, 2.33, 0],
      );
    }
  }
}
