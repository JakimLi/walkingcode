/**
 * Electron main process entry.
 *
 * On launch:
 *   1. parse argv → arch file + optional repo override
 *   2. initSession (read + tolerantly parse the arch file, resolve repo root)
 *   3. register IPC handlers
 *   4. create the BrowserWindow and load the renderer (dev URL or built file)
 *
 * The CLI spawns us with:  electron <entry> <archFile> [--repo <path>]
 */
import { app, BrowserWindow, shell, ipcMain, type RenderProcessGoneDetails } from 'electron'
import { existsSync, mkdirSync, appendFileSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { parseLaunchArgs } from './args.js'
import { initSession, registerIpc } from './ipc.js'

const LOG_FILE = join(homedir(), '.walkingcode', 'runtime', 'app.log')
function log(msg: string): void {
  const line = `[${new Date().toISOString()}] ${msg}\n`
  try {
    mkdirSync(join(homedir(), '.walkingcode', 'runtime'), { recursive: true })
    appendFileSync(LOG_FILE, line, 'utf8')
  } catch {
    /* ignore */
  }
  // also surface on stderr so a foreground launch shows it
  console.error(msg)
}
log(`==== WalkingCode starting (pid ${process.pid}) ====`)
log(`argv: ${JSON.stringify(process.argv)}`)
log(`ELECTRON_RENDERER_URL: ${process.env.ELECTRON_RENDERER_URL ?? '(unset)'}`)
log(`cwd: ${process.cwd()}`)

// Is the renderer served by vite dev? electron-vite sets process.env.ELECTRON_RENDERER_URL.
const DEV_SERVER_URL = process.env.ELECTRON_RENDERER_URL ?? null

/**
 * Window-control IPC: the frameless toolbar's in-DOM buttons call these on
 * Windows/Linux (macOS uses the native traffic lights). Also exposes the
 * platform so the renderer knows whether to render its own caption buttons.
 */
function registerWindowControls(): void {
  ipcMain.handle('win:minimize', () => {
    BrowserWindow.getFocusedWindow()?.minimize()
  })
  ipcMain.handle('win:toggle-maximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  })
  ipcMain.handle('win:close', () => {
    BrowserWindow.getFocusedWindow()?.close()
  })
  ipcMain.handle('win:is-maximized', () => {
    return BrowserWindow.getFocusedWindow()?.isMaximized() ?? false
  })
}

function createWindow(): BrowserWindow {
  // Build options as a plain object (with the runtime-only option) and pass it
  // in — TS doesn't excess-property-check a widened object the way it does a
  // literal, and the option is real at the Electron runtime.
  const isMac = process.platform === 'darwin'
  const opts: Electron.BrowserWindowConstructorOptions = {
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    x: 80,
    y: 80,
    backgroundColor: '#08090c',
    title: 'WalkingCode',
    show: false, // show on 'ready-to-show' to avoid a white flash
    // Frameless-ish: hide the native title bar. macOS keeps the traffic-light
    // buttons via `hiddenInset` (inset + no title text); Windows/Linux use a
    // native overlay (Electron ≥30) or our custom in-DOM controls in the toolbar.
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    titleBarOverlay: isMac
      ? undefined
      : {
          color: '#0b0d12',
          symbolColor: '#8b95a7',
          height: 44,
        },
    trafficLightPosition: { x: 14, y: 15 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  }
  // visibleOnAllWorkspaces guards against macOS Spaces hiding the window.
  // Cast because the installed @types/electron is slightly behind.
  ;(opts as Record<string, unknown>).visibleOnAllWorkspaces = true
  const win = new BrowserWindow(opts)
  let shown = false
  const showIt = (reason: string): void => {
    if (shown) return
    shown = true
    log(`showing window (${reason})`)
    win.show()
    win.focus()
    win.moveTop()
  }
  win.once('ready-to-show', () => showIt('ready-to-show'))
  // safety net: if ready-to-show never fires (e.g. a slow/hung renderer),
  // force the window visible after 6s so the user at least sees something.
  setTimeout(() => showIt('timeout-fallback'), 6000)

  // surface renderer-side failures to the log
  win.webContents.on('did-fail-load', (_e, code, desc, url) => {
    log(`did-fail-load: code=${code} desc=${desc} url=${url}`)
  })
  win.webContents.on('console-message', (_e, level, message, line, source) => {
    log(`renderer console[${level}]: ${message} (${source}:${line})`)
  })
  win.webContents.on('render-process-gone', (_e, details: RenderProcessGoneDetails) => {
    log(`render-process-gone: ${JSON.stringify(details)}`)
  })
  win.on('unresponsive', () => log('window unresponsive'))
  win.on('closed', () => log('window closed'))

  // open external links in the browser, not the app
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url).catch(() => {})
    return { action: 'deny' }
  })

  if (DEV_SERVER_URL) {
    log(`loading dev server: ${DEV_SERVER_URL}`)
    win.loadURL(DEV_SERVER_URL).catch((e) => log(`loadURL failed: ${e}`))
  } else {
    // production: bundled renderer
    const indexHtml = join(__dirname, '../renderer/index.html')
    log(`loading file: ${indexHtml} (exists=${existsSync(indexHtml)})`)
    if (existsSync(indexHtml)) {
      win.loadFile(indexHtml).catch((e) => log(`loadFile failed: ${e}`))
    } else {
      log(`renderer build not found at ${indexHtml}`)
      win.loadURL('data:text/plain,' + encodeURIComponent('Renderer build not found.'))
    }
  }

  return win
}

// No single-instance lock: each `walkingcode open <file>` spawns its own
// process, so multiple arch files can be open simultaneously in isolated
// windows. Each process owns its own session + preload.
app.whenReady().then(() => {
  log('app ready')
  const args = parseLaunchArgs()
  log(`parsed args: ${JSON.stringify(args)}`)
  try {
    initSession({ archFile: args.archFile, repoOverride: args.repo })
    registerIpc(() => BrowserWindow.getFocusedWindow())
    registerWindowControls()
    createWindow()
    log('createWindow returned')
  } catch (e) {
    log(`startup error: ${(e as Error).stack ?? String(e)}`)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  log('window-all-closed')
  app.quit()
})
