import { expect, it } from "vitest";
import { getViewport } from "../../src/core/viewport";

it("표시 영역의 종횡비를 계산하고 고해상도 픽셀 비율을 제한한다", () => {
  expect(getViewport(900.9, 450, 3)).toEqual({
    width: 900,
    height: 450,
    aspect: 2,
    pixelRatio: 2,
  });
  expect(getViewport(0, 0, 0)).toEqual({
    width: 1,
    height: 1,
    aspect: 1,
    pixelRatio: 1,
  });
});
