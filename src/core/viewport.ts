export function getViewport(width: number, height: number, devicePixelRatio: number) {
  const pixelWidth = Math.max(1, Math.floor(width));
  const pixelHeight = Math.max(1, Math.floor(height));

  return {
    width: pixelWidth,
    height: pixelHeight,
    aspect: pixelWidth / pixelHeight,
    pixelRatio: Math.min(2, Math.max(1, devicePixelRatio)),
  };
}
