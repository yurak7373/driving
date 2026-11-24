import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Box3, Group, Mesh, Texture, Vector3 } from "three";
import { preProcessFile } from "typescript";
import { describe, expect, it, vi } from "vitest";
import { getMeshResources } from "../../src/core/modelResources";
import {
  busConfig,
  cameraAnchors,
  frontAxleZ,
  frontZ,
  liveryConfig,
  rearAxleZ,
  rearZ,
  requiredNodes,
  wheelNames,
} from "../../src/vehicles/bus/busConfig";
import { createBusVisual } from "../../src/vehicles/bus/busVisual";

describe("한국형 버스 외형", () => {
  it("미터 단위 제원, 지면과 바퀴, 차축의 위치가 일치한다", () => {
    const {
      length,
      width,
      height,
      wheelbase,
      frontOverhang,
      rearOverhang,
      tireRadius,
      tireWidth,
    } = busConfig;
    for (const quantity of [
      length,
      width,
      height,
      wheelbase,
      frontOverhang,
      rearOverhang,
      tireRadius,
      tireWidth,
    ]) {
      expect(quantity).toBeGreaterThan(0);
    }
    expect(length).toBeCloseTo(frontOverhang + wheelbase + rearOverhang);
    expect(frontAxleZ - rearAxleZ).toBeCloseTo(wheelbase);
    expect(frontZ - frontAxleZ).toBeCloseTo(frontOverhang);
    expect(rearAxleZ - rearZ).toBeCloseTo(rearOverhang);
    const model = createBusVisual();
    const { root } = model;
    const parts = wheelNames.map((name) => {
      const wheel = root.getObjectByName(name)!;
      const tire = wheel.getObjectByName("Tire")!;
      const position = wheel.getWorldPosition(new Vector3());
      const bounds = new Box3().setFromObject(tire);
      expect(bounds.min.y).toBeCloseTo(0);
      expect(bounds.max.y).toBeCloseTo(2 * tireRadius);
      return position;
    });
    const [fl, fr, rlOuter, rlInner, rrOuter, rrInner] = parts;
    expect(fl.x).toBeGreaterThan(0);
    expect(fr.x).toBeLessThan(0);
    expect(fl.z).toBeCloseTo(frontAxleZ);
    expect(fr.z).toBeCloseTo(frontAxleZ);
    for (const wheel of parts.slice(2)) expect(wheel.z).toBeCloseTo(rearAxleZ);
    expect(rlOuter.x - rlInner.x).toBeGreaterThan(tireWidth);
    expect(rrInner.x - rrOuter.x).toBeGreaterThan(tireWidth);
    expect(
      new Box3()
        .setFromObject(root.getObjectByName("Roof")!)
        .getSize(new Vector3()).x,
    ).toBeCloseTo(width);
    expect(new Box3().setFromObject(root).max.y).toBeCloseTo(height);
    model.dispose();
  });

  it("필수 노드와 문짝·조향 그룹이 차량 루트에 속한다", () => {
    const model = createBusVisual();
    expect(model.inspect().missing).toEqual([]);
    expect(model.inspect().wheels).toHaveLength(6);
    const names: string[] = [];
    model.root.traverse((node) => {
      if (requiredNodes.some((name) => name === node.name))
        names.push(node.name);
    });
    expect(names.sort()).toEqual([...requiredNodes].sort());
    for (const name of cameraAnchors) {
      expect(model.root.getObjectByName(name)?.parent?.name).toBe(
        "CameraAnchors",
      );
    }
    for (const name of ["FrontDoor", "MiddleDoor"]) {
      const door = model.root.getObjectByName(name);
      expect(door?.parent?.name).toBe("RightBody");
      expect(door?.getObjectByName("LeafRearPivot")).toBeInstanceOf(Group);
      expect(
        door?.getObjectByName("LeafFrontPivot")?.getObjectByName("DoorGlass"),
      ).toBeInstanceOf(Mesh);
    }
    const left = model.root.getObjectByName("Wheel_FL");
    expect(left?.parent?.name).toBe("Steering_L");
    model.applyPose({
      position: [1, 2, 3],
      rotation: [0, 0.4, 0],
      steering: 0.2,
      wheelRoll: 0.9,
    });
    expect(model.root.position.toArray()).toEqual([1, 2, 3]);
    expect(model.root.rotation.y).toBe(0.4);
    expect(left?.parent?.rotation.y).toBe(0.2);
    expect(left?.rotation.x).toBe(0.9);
    expect(model.root.getObjectByName("Wheel_RL_Inner")?.rotation.x).toBe(0.9);
    expect(model.root.getObjectByName("RearAxle")?.rotation.y).toBe(0);
    model.dispose();
  });

  it("도색을 적용해도 제원과 위치 및 노드가 유지된다", () => {
    const model = createBusVisual();
    const original = new Box3().setFromObject(model.root);
    const part = model.root.getObjectByName("LowerFascia") as Mesh;
    const painted = part.material;
    for (const livery of ["green", "blue", "red", "yellow"] as const) {
      model.applyLivery(livery);
      expect(model.getPaintColor()).toBe(liveryConfig[livery].color);
      expect(part.material).toBe(painted);
      expect(new Box3().setFromObject(model.root).equals(original)).toBe(true);
    }
    model.dispose();
  });

  it("소유 자원만 한 번씩 해제하고 다른 차량과 공유 텍스처는 보존한다", () => {
    const shared = new Texture();
    const onTexture = vi.fn();
    shared.addEventListener("dispose", onTexture);
    const model = createBusVisual({ destination: shared });
    const other = createBusVisual({ destination: shared });
    const stage = new Group();
    stage.add(model.root, other.root);
    const { geometries, materials } = getMeshResources(model.root);
    const onGeometry = vi.fn();
    const onMaterial = vi.fn();
    geometries.forEach((geometry) =>
      geometry.addEventListener("dispose", onGeometry),
    );
    materials.forEach((material) =>
      material.addEventListener("dispose", onMaterial),
    );
    model.dispose();
    model.dispose();
    expect(stage.children).toEqual([other.root]);
    expect(onGeometry).toHaveBeenCalledTimes(geometries.size);
    expect(onMaterial).toHaveBeenCalledTimes(materials.size);
    expect(onTexture).not.toHaveBeenCalled();
    other.dispose();
    shared.dispose();
    expect(onTexture).toHaveBeenCalledTimes(1);
  });

  it("외형과 내부 의존성이 입력·장면·물리 모듈에 의존하지 않으며 순환하지 않는다", () => {
    const entry = fileURLToPath(
      new URL("../../src/vehicles/bus/busVisual.ts", import.meta.url),
    );
    const active = new Set<string>();
    const checked = new Set<string>();

    function visit(path: string) {
      expect(path).not.toMatch(/\/src\/(input|physics|scenes|ui)\//);
      expect(active.has(path), path).toBe(false);
      if (checked.has(path)) return;
      active.add(path);
      const { importedFiles } = preProcessFile(
        readFileSync(path, "utf8"),
        true,
        true,
      );
      for (const { fileName } of importedFiles) {
        if (fileName.startsWith("."))
          visit(resolve(dirname(path), `${fileName}.ts`));
      }
      active.delete(path);
      checked.add(path);
    }

    visit(entry);
  });
});
