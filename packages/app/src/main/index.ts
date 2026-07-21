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
import { app, BrowserWindow, shell, type RenderProcessGoneDetails } from 'electron'
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

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    x: 80,
    y: 80,
    backgroundColor: '#0a0c10',
    title: 'WalkingCode',
    show: false, // show on 'ready-to-show' to avoid a white flash
    visibleOnAllWorkspaces: true, // guard against macOS Spaces hiding the window
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })
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

// single-instance lock — the CLI refuses a second `open` anyway, but be defensive
const gotLock = app.requestSingleInstanceLock()
log(`single-instance lock acquired: ${gotLock}`)
if (!gotLock) {
  log('another instance holds the lock — quitting')
  app.quit()
} else {
  app.on('second-instance', () => {
    log('second-instance event received (ignored)')
  })

  app.whenReady().then(() => {
    log('app ready')
    const args = parseLaunchArgs()
    log(`parsed args: ${JSON.stringify(args)}`)
    try {
      initSession({ archFile: args.archFile, repoOverride: args.repo })
      registerIpc(() => BrowserWindow.getFocusedWindow())
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
    if (process.platform !== 'darwin') app.quit()
  })
}
