export const MIN_SCALE = 0.1;
export const MAX_SCALE = 8;

export function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function fitView(viewportWidth, viewportHeight, imageWidth, imageHeight, padding = 32) {
  if (![viewportWidth, viewportHeight, imageWidth, imageHeight].every((value) => Number.isFinite(value) && value > 0)) {
    return {scale: 1, x: 0, y: 0};
  }

  const availableWidth = Math.max(1, viewportWidth - padding * 2);
  const availableHeight = Math.max(1, viewportHeight - padding * 2);
  const scale = clamp(Math.min(availableWidth / imageWidth, availableHeight / imageHeight), MIN_SCALE, 2);

  return {
    scale,
    x: (viewportWidth - imageWidth * scale) / 2,
    y: (viewportHeight - imageHeight * scale) / 2,
  };
}

export function zoomView(view, factor, anchorX, anchorY) {
  const scale = clamp(view.scale * factor, MIN_SCALE, MAX_SCALE);
  const imageX = (anchorX - view.x) / view.scale;
  const imageY = (anchorY - view.y) / view.scale;

  return {
    scale,
    x: anchorX - imageX * scale,
    y: anchorY - imageY * scale,
  };
}
