/**
 * Preload bridge — exposes `window.wc` to the renderer via contextBridge.
 *
 * Mirrors the WCApi interface in renderer/src/types/preload.d.ts. Keeps all
 * Node/fs access here; the renderer only sees the typed RPC surface.
 */
import { contextBridge, ipcRenderer } from 'electron'

const api = {
  arch: {
    load: () => ipcRenderer.invoke('arch:load'),
  },
  code: {
    read: (file: string, repo?: string) => ipcRenderer.invoke('code:read', file, repo),
  },
  comments: {
    read: () => ipcRenderer.invoke('comments:read'),
    add: (input: { nodeId: string; body: string; line?: number }) =>
      ipcRenderer.invoke('comments:add', input),
    resolve: (id: string) => ipcRenderer.invoke('comments:resolve', id),
  },
  on: (event: 'reload', cb: () => void) => {
    const listener = (): void => cb()
    ipcRenderer.on(event, listener)
    return () => ipcRenderer.removeListener(event, listener)
  },
}

// The browser type is declared in renderer/src/types/preload.d.ts.
// Cast through unknown to satisfy contextBridge's strict typing.
contextBridge.exposeInMainWorld('wc', api as unknown as Record<string, unknown>)
