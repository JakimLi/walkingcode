/**
 * Vite-specific ambient declarations used by the renderer.
 *
 * `?worker` imports are Vite's way of bundling a Web Worker; the type here is
 * loose on purpose — Monaco only calls `new XWorker()` on it.
 */
declare module '*?worker' {
  const workerConstructor: {
    new (): Worker
  }
  export default workerConstructor
}

declare module '*?worker&inline' {
  const workerConstructor: {
    new (): Worker
  }
  export default workerConstructor
}
