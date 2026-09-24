export function prepareCanvas(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  if (!context) return null;
  // Cap the backing store to keep four previews and the live game inexpensive.
  const ratio = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  const width = Math.round(640 * ratio);
  const height = Math.round(400 * ratio);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  context.setTransform(width / 640, 0, 0, height / 400, 0, 0);
  return context;
}
