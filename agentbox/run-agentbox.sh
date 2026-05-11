#!/usr/bin/env bash
set -euo pipefail

# agentbox launcher. Two modes:
#
#   create:  --name NAME --image IMAGE [...] [REPO_DIR]
#            Creates a fresh container. Fails if NAME already exists.
#
#   attach:  --attach NAME
#            Attaches to an existing container. Fails if NAME doesn't
#            exist. Auto-starts it if stopped.
#
# Building the image is intentionally not handled here — build it
# yourself with `podman build` and pass the tag in via --image.

usage() {
  cat <<EOF
Usage:
  $(basename "$0") --name NAME --image IMAGE [options] [REPO_DIR]   # create
  $(basename "$0") --attach NAME                                    # attach

Create mode:
  --name NAME           Container name. Also used for the home volume
                        ("NAME-home") and the in-container workspace
                        path (/workspace/NAME).
  --image IMAGE         Image tag to run (default: agentbox:latest).
  --port HOST:CONTAINER Publish a container port to the host. Same
                        syntax as `podman run -p`. Repeatable. Note:
                        ports are baked in at create time; adding more
                        later requires recreating the container.
  --mount SRC:DST[:OPT] Extra bind mount passed as `podman run -v`.
                        Repeatable.
  REPO_DIR              Repo directory to bind-mount at /workspace/NAME
                        (default: current working directory).

Attach mode:
  --attach NAME         Attach to an existing container. Mutually
                        exclusive with create-mode flags.

Common:
  -h, --help            Show this help.
EOF
}

NAME=""
IMAGE=""
ATTACH=""
PORTS=()
MOUNTS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)       NAME="$2"; shift 2 ;;
    --image)      IMAGE="$2"; shift 2 ;;
    --attach)     ATTACH="$2"; shift 2 ;;
    --port)       PORTS+=("$2"); shift 2 ;;
    --mount)      MOUNTS+=("$2"); shift 2 ;;
    -h|--help)    usage; exit 0 ;;
    --)           shift; break ;;
    -*)           echo "Unknown flag: $1" >&2; usage >&2; exit 1 ;;
    *)            break ;;
  esac
done

# --- attach mode ---------------------------------------------------------
if [[ -n "${ATTACH}" ]]; then
  if [[ -n "${NAME}" || ${#PORTS[@]} -gt 0 || ${#MOUNTS[@]} -gt 0 ]]; then
    echo "--attach is mutually exclusive with create-mode flags (--name/--image/--port/--mount)" >&2
    exit 1
  fi
  if ! podman container exists "${ATTACH}"; then
    echo "no container named '${ATTACH}'" >&2
    exit 1
  fi
  if [[ "$(podman container inspect -f '{{.State.Running}}' "${ATTACH}")" != "true" ]]; then
    podman start "${ATTACH}" >/dev/null
  fi
  exec podman exec -it \
    --detach-keys="" \
    -w "/workspace/${ATTACH}" \
    -e TERM="${TERM}" \
    -e COLORTERM="${COLORTERM:-truecolor}" \
    "${ATTACH}" bash
fi

# --- create mode ---------------------------------------------------------
if [[ -z "${NAME}" ]]; then
  echo "--name is required (or use --attach NAME)" >&2
  usage >&2
  exit 1
fi

IMAGE="${IMAGE:-agentbox:latest}"

if podman container exists "${NAME}"; then
  echo "container '${NAME}' already exists; use --attach ${NAME} to connect, or 'podman rm -f ${NAME}' to recreate" >&2
  exit 1
fi

REPO_DIR="$(realpath "${1:-$(pwd)}")"

mkdir -p \
  "${HOME}/.cache/agentbox-bazel-disk" \
  "${HOME}/.cache/bazelisk"

# The HOME named volume catches everything written under /home/dev by
# default (claude config, pi sessions, shell history, etc.). Specific
# paths are then bind-mounted on top to share host caches and dotfiles.
#
# Pi dotfiles: only specific files are shared. Sessions stay in the
# volume — sharing them with host pi causes lock-file deadlocks.
PI_MOUNTS=()
for item in auth.json keybindings.json settings.json extensions prompts skills; do
  src="${HOME}/.pi/agent/${item}"
  [[ -e "${src}" ]] || continue
  target="$(realpath "${src}" 2>/dev/null)" || continue
  [[ -e "${target}" ]] || continue
  PI_MOUNTS+=(-v "${target}:/home/dev/.pi/agent/${item}")
done

# Forward host env: any AGENTBOX_<NAME> on the host surfaces as
# <NAME> inside the container. To expose a value, just export
# AGENTBOX_<NAME> on the host before invoking this script.
SECRET_ENVS=()
while IFS='=' read -r host_name host_value; do
  [[ "${host_name}" == AGENTBOX_* ]] || continue
  bare="${host_name#AGENTBOX_}"
  [[ -n "${bare}" ]] || continue
  SECRET_ENVS+=(-e "${bare}=${host_value}")
done < <(env)

PORT_ARGS=()
if [[ ${#PORTS[@]} -gt 0 ]]; then
  for p in "${PORTS[@]}"; do
    PORT_ARGS+=(-p "${p}")
  done
fi

EXTRA_MOUNT_ARGS=()
if [[ ${#MOUNTS[@]} -gt 0 ]]; then
  for m in "${MOUNTS[@]}"; do
    EXTRA_MOUNT_ARGS+=(-v "${m}")
  done
fi

DOTFILE_MOUNTS=()
_add_mount() {
  local src="$1" dst="$2" mode="${3:-rw}"
  [[ -e "${src}" ]] || return 0
  local target
  target="$(realpath "${src}" 2>/dev/null)" || return 0
  [[ -e "${target}" ]] || return 0
  DOTFILE_MOUNTS+=(-v "${target}:${dst}:${mode}")
}
_add_mount "${HOME}/.tmux.conf" "/home/dev/.tmux.conf" rw
_add_mount "${HOME}/.gitconfig" "/home/dev/.gitconfig" ro
# TODO: mount only specific keys rather than the full ~/.ssh to limit
# key exposure in the container
# _add_mount "${HOME}/.ssh"     "/home/dev/.ssh"       ro

X11_ENV_ARGS=()
X11_MOUNTS=()
if [[ -n "${DISPLAY:-}" && -d /tmp/.X11-unix ]]; then
  X11_ENV_ARGS+=(-e "DISPLAY=${DISPLAY}")
  X11_MOUNTS+=(-v "/tmp/.X11-unix:/tmp/.X11-unix:rw")

  if [[ -f "${HOME}/.Xauthority" ]]; then
    X11_MOUNTS+=(-v "${HOME}/.Xauthority:/home/dev/.Xauthority:ro")
    X11_ENV_ARGS+=(-e "XAUTHORITY=/home/dev/.Xauthority")
  fi

  if command -v xhost >/dev/null 2>&1; then
    xhost +SI:localuser:"$(id -un)" >/dev/null 2>&1 || true
  fi
fi

podman run -d \
  --name "${NAME}" \
  --init \
  --userns=keep-id \
  --cap-drop=ALL \
  -e BAZELISK_HOME=/home/dev/.cache/bazelisk \
  -e CLAUDE_CONFIG_DIR=/home/dev/.claude \
  -e TERM="${TERM}" \
  -e COLORTERM="${COLORTERM:-truecolor}" \
  "${X11_ENV_ARGS[@]}" \
  -v "${REPO_DIR}:/workspace/${NAME}" \
  -v "${NAME}-home:/home/dev" \
  -v "${HOME}/.cache/agentbox-bazel-disk:/var/tmp/bazel-disk-cache" \
  -v "${HOME}/.cache/bazelisk:/home/dev/.cache/bazelisk" \
  "${SECRET_ENVS[@]}" \
  "${PORT_ARGS[@]}" \
  "${EXTRA_MOUNT_ARGS[@]}" \
  "${X11_MOUNTS[@]}" \
  "${PI_MOUNTS[@]}" \
  "${DOTFILE_MOUNTS[@]}" \
  "${IMAGE}" \
  "sleep infinity" >/dev/null

exec podman exec -it \
  --detach-keys="" \
  -w "/workspace/${NAME}" \
  -e TERM="${TERM}" \
  -e COLORTERM="${COLORTERM:-truecolor}" \
  "${NAME}" bash
