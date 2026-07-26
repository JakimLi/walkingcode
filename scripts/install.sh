#!/usr/bin/env bash
#
# WalkingCode — one-line installer.
#
#   curl -fsSL https://raw.githubusercontent.com/JakimLi/walkingcode/main/scripts/install.sh | bash
#
# What it does:
#   1. Checks Node >= 20 and git are available.
#   2. Clones (or updates) the repo into $INSTALL_DIR (default ~/.walkingcode/src).
#   3. npm install (fetches the Electron binary).
#   4. Builds schema → CLI → app.
#   5. Symlinks `walkingcode` onto PATH (/usr/local/bin on macOS/Linux).
#
# Re-running the script updates to the latest version (idempotent).
#
set -euo pipefail

# ---- config ---------------------------------------------------------------
REPO_URL="https://github.com/JakimLi/walkingcode.git"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.walkingcode/src}"
BIN_NAME="walkingcode"
# Where to place the global symlink. Prefer /usr/local/bin (on PATH for most
# setups); fall back to ~/.local/bin.
SYMLINK_DIR="/usr/local/bin"
FALLBACK_SYMLINK_DIR="$HOME/.local/bin"

# ---- pretty printing ------------------------------------------------------
bold() { printf "\033[1m%s\033[0m\n" "$*"; }
dim()  { printf "\033[2m%s\033[0m\n" "$*"; }
ok()   { printf "  \033[32m✓\033[0m %s\n" "$*"; }
warn() { printf "  \033[33m!\033[0m %s\n" "$*"; }
err()  { printf "  \033[31m✗\033[0m %s\n" "$*" >&2; }
info() { printf "  \033[36m→\033[0m %s\n" "$*"; }

# ---- banner ---------------------------------------------------------------
bold "WalkingCode installer"
echo ""
dim  "This will clone the repo, install dependencies (incl. Electron), build"
dim  "everything, and link the \`walkingcode\` command onto your PATH."
echo ""

# ---- platform check -------------------------------------------------------
case "$(uname -s)" in
  Darwin*|Linux*) ;;
  MINGW*|MSYS*|CYGWIN*)
    err "Windows detected. The one-line installer supports macOS and Linux only."
    err "On Windows, clone the repo and run manually:"
    err "   git clone ${REPO_URL}"
    err "   cd walkingcode && npm install && npm run build:schema && npm run build:cli && npm run build:app"
    exit 1
    ;;
  *)
    err "Unknown platform: $(uname -s). Please install manually."
    exit 1
    ;;
esac

# ---- dependency checks ----------------------------------------------------
command -v git >/dev/null 2>&1 || { err "git is required but not on PATH. Install it first."; exit 1; }
ok "git found"

if ! command -v node >/dev/null 2>&1; then
  err "Node.js is required (>= 20) but not on PATH. Install it from https://nodejs.org"
  exit 1
fi
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
if [ "$NODE_MAJOR" -lt 20 ]; then
  err "Node >= 20 is required (found v$(node -v)). Upgrade from https://nodejs.org"
  exit 1
fi
ok "Node v$(node -v)"

if ! command -v npm >/dev/null 2>&1; then
  err "npm is required but not on PATH (should ship with Node)."
  exit 1
fi
ok "npm $(npm -v)"

# ---- clone / update -------------------------------------------------------
if [ -d "$INSTALL_DIR/.git" ]; then
  info "Existing install found at $INSTALL_DIR — updating…"
  (cd "$INSTALL_DIR" && git pull --ff-only)
else
  info "Cloning into $INSTALL_DIR …"
  mkdir -p "$(dirname "$INSTALL_DIR")"
  # Some networks misnegotiate HTTP/2; fall back to HTTP/1.1 if clone fails.
  git clone --depth 1 "$REPO_URL" "$INSTALL_DIR" \
    || git -c http.version=HTTP/1.1 clone --depth 1 "$REPO_URL" "$INSTALL_DIR"
fi
ok "source ready"

cd "$INSTALL_DIR"

# ---- install dependencies -------------------------------------------------
info "Installing dependencies (this downloads Electron — may take a minute)…"
npm install --no-fund --no-audit
ok "dependencies installed"

# ---- ensure the Electron binary is present + signed -----------------------
# macOS Gatekeeper blocks the unsigned Electron binary that npm's postinstall
# fetches, so on Darwin we explicitly re-run the download and ad-hoc re-sign
# the .app bundle. Without this, `walkingcode open` is killed on launch.
if [ "$(uname -s)" = "Darwin" ]; then
  ELECTRON_APP="$INSTALL_DIR/node_modules/electron/dist/Electron.app"
  if [ ! -d "$ELECTRON_APP" ]; then
    info "Electron binary missing — re-downloading…"
    (cd "$INSTALL_DIR" && node node_modules/electron/install.js) || true
  fi
  if [ -d "$ELECTRON_APP" ]; then
    info "Ad-hoc signing the Electron app (bypasses Gatekeeper)…"
    codesign --force --deep --sign - "$ELECTRON_APP" 2>/dev/null \
      || warn "codesign failed — the OS may block the app on launch."
    ok "Electron ready"
  else
    warn "Electron binary still missing. 'walkingcode open' will not work."
    warn "Try: cd $INSTALL_DIR && node node_modules/electron/install.js"
  fi
fi

# ---- build ----------------------------------------------------------------
info "Building schema…"
npm run build:schema
ok "schema built"

info "Building CLI…"
npm run build:cli
ok "CLI built"

info "Building Electron app (this takes a bit)…"
npm run build:app
ok "app built"

# ---- symlink onto PATH ----------------------------------------------------
CLI_BIN="$INSTALL_DIR/packages/cli/dist/index.js"
[ -f "$CLI_BIN" ] || { err "CLI bundle not found at $CLI_BIN — build may have failed."; exit 1; }
chmod +x "$CLI_BIN"

link_target="$BIN_NAME"
linked=false

# Try the preferred dir first, fall back to ~/.local/bin.
for dir in "$SYMLINK_DIR" "$FALLBACK_SYMLINK_DIR"; do
  mkdir -p "$dir" 2>/dev/null || true
  # remove a stale link if present
  rm -f "$dir/$link_target" 2>/dev/null || true
  if ln -s "$CLI_BIN" "$dir/$link_target" 2>/dev/null; then
    if command -v "$BIN_NAME" >/dev/null 2>&1; then
      ok "linked $BIN_NAME → $dir/$link_target"
      linked=true
      break
    else
      # the link was created but isn't on PATH yet — still counts, we'll hint
      ok "linked $BIN_NAME → $dir/$link_target"
      linked=true
      NEED_PATH_HINT="$dir"
      break
    fi
  fi
done

if [ "$linked" = false ]; then
  # couldn't write anywhere — instruct the user
  err "Could not create a symlink automatically. Link it yourself:"
  err "   sudo ln -s $CLI_BIN /usr/local/bin/$BIN_NAME"
  err "or add an alias to your shell profile:"
  err "   alias walkingcode=\"$CLI_BIN\""
fi

# ---- done -----------------------------------------------------------------
echo ""
bold "WalkingCode is installed."
echo ""
if [ "${NEED_PATH_HINT:-}" != "" ]; then
  dim "Add $NEED_PATH_HINT to your PATH to use \`walkingcode\`, e.g.:"
  dim "   echo 'export PATH=\"$NEED_PATH_HINT:\$PATH\"' >> ~/.bashrc   # or ~/.zshrc"
  echo ""
fi
echo "  Try the bundled example:"
echo ""
echo "    \033[36mwalkingcode validate examples/layered-arch.json\033[0m"
echo "    \033[36mwalkingcode open examples/layered-arch.json\033[0m"
echo ""
echo "  Generate your own diagram from a repo — see:"
echo "    \033[36mhttps://github.com/JakimLi/walkingcode#agent-loop\033[0m"
echo ""
dim "To update later, just re-run this installer."
