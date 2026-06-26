#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<EOF
Usage:
  $(basename "$0") create --name NAME [options] [REPO_DIR]
  $(basename "$0") attach --name NAME
  $(basename "$0") list
  $(basename "$0") remove --name NAME [--with-home-volume]

Commands:
  create                 Create a fresh container and attach to it.
  attach                 Attach to an existing container (auto-start if needed).
  list                   List agentbox containers.
  remove                 Remove container (optionally its home volume).

Create options:
  --name NAME            Container name (also volume: NAME-home)
  --image IMAGE          Image tag to run (default: agentbox:latest)
  --port HOST:CONTAINER  Publish a port (-p). Repeatable.
  --host-network         Use host network (--network host). Mutually exclusive with --port/--network.
  --network NAME         Attach to a Podman network. Mutually exclusive with --host-network.
  --mount SRC:DST[:OPT]  Extra bind mount (-v). Repeatable.

Attach/remove options:
  --name NAME            Container name.

Remove options:
  --with-home-volume     Also remove the named volume NAME-home.

Common:
  -h, --help             Show help.
EOF
}

attach_exec() {
  local name="$1"
  if ! podman container exists "${name}"; then
    echo "no container named '${name}'" >&2
    exit 1
  fi
  if [[ "$(podman container inspect -f '{{.State.Running}}' "${name}")" != "true" ]]; then
    podman start "${name}" >/dev/null
  fi

  local workdir
  workdir="$(podman container inspect -f '{{range .Config.Env}}{{println .}}{{end}}' "${name}" | rg '^AGENTBOX_REPO_DIR=' | head -n1 | cut -d= -f2- || true)"
  workdir="${workdir:-/workspace/${name}}"

  exec podman exec -it \
    --detach-keys="" \
    -w "${workdir}" \
    -e TERM="${TERM}" \
    -e COLORTERM="${COLORTERM:-truecolor}" \
    "${name}" bash
}

create_cmd() {
  local name=""
  local image="agentbox:latest"
  local host_network=0
  local network=""
  local repo_dir=""
  local -a ports=()
  local -a mounts=()

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --name) name="$2"; shift 2 ;;
      --image) image="$2"; shift 2 ;;
      --port) ports+=("$2"); shift 2 ;;
      --host-network) host_network=1; shift ;;
      --network) network="$2"; shift 2 ;;
      --mount) mounts+=("$2"); shift 2 ;;
      -h|--help) usage; exit 0 ;;
      --) shift; break ;;
      -*) echo "Unknown flag: $1" >&2; usage >&2; exit 1 ;;
      *) repo_dir="$1"; shift ;;
    esac
  done

  [[ -n "${name}" ]] || { echo "--name is required" >&2; usage >&2; exit 1; }
  [[ ${host_network} -eq 1 && ${#ports[@]} -gt 0 ]] && { echo "--host-network cannot be used with --port" >&2; exit 1; }
  [[ ${host_network} -eq 1 && -n "${network}" ]] && { echo "--host-network cannot be used with --network" >&2; exit 1; }

  if podman container exists "${name}"; then
    echo "container '${name}' already exists; use: $(basename "$0") attach --name ${name}" >&2
    exit 1
  fi

  repo_dir="$(realpath "${repo_dir:-$(pwd)}")"

  local bazel_disk_cache="${AGENTBOX_BAZEL_DISK_CACHE:-${HOME}/.cache/bazel/disk-cache}"
  local bazel_repository_cache="${AGENTBOX_BAZEL_REPOSITORY_CACHE:-}"
  if [[ -z "${bazel_repository_cache}" ]] && command -v bazel >/dev/null 2>&1; then
    bazel_repository_cache="$(cd "${repo_dir}" && timeout 10s bazel info repository_cache 2>/dev/null || true)"
  fi
  bazel_repository_cache="${bazel_repository_cache:-${HOME}/.cache/bazel/repository-cache}"
  mkdir -p "${bazel_disk_cache}" "${bazel_repository_cache}" "${HOME}/.cache/bazelisk"

  local -a pi_mounts=()
  if [[ -d "${HOME}/.pi" ]]; then
    pi_mounts+=(-v "${HOME}/.pi:/home/dev/.pi")
  fi
  if [[ -d "${HOME}/.dotfiles/pi" ]]; then
    pi_mounts+=(-v "${HOME}/.dotfiles/pi:/home/regb/.dotfiles/pi:rw")
  fi

  local -a secret_envs=()
  while IFS='=' read -r host_name host_value; do
    [[ "${host_name}" == AGENTBOX_* ]] || continue
    bare="${host_name#AGENTBOX_}"
    [[ -n "${bare}" ]] || continue
    secret_envs+=(-e "${bare}=${host_value}")
  done < <(env)

  local -a port_args=()
  for p in "${ports[@]}"; do port_args+=(-p "${p}"); done

  local -a network_args=()
  if [[ ${host_network} -eq 1 ]]; then
    network_args+=(--network host)
  elif [[ -n "${network}" ]]; then
    network_args+=(--network "${network}")
  fi

  local -a extra_mount_args=()
  for m in "${mounts[@]}"; do extra_mount_args+=(-v "${m}"); done

  local -a dotfile_mounts=()
  _add_mount() {
    local src="$1" dst="$2" mode="${3:-rw}"
    [[ -e "${src}" ]] || return 0
    local target
    target="$(realpath "${src}" 2>/dev/null)" || return 0
    [[ -e "${target}" ]] || return 0
    dotfile_mounts+=(-v "${target}:${dst}:${mode}")
  }
  _add_mount "${HOME}/.tmux.conf" "/home/dev/.tmux.conf" rw
  _add_mount "${HOME}/.gitconfig" "/home/dev/.gitconfig" ro
  _add_mount "${HOME}/.agentbox/tools/bin" "/home/dev/.agentbox/tools/bin" ro,z

  local -a x11_env_args=()
  local -a x11_mounts=()
  if [[ -n "${DISPLAY:-}" && -d /tmp/.X11-unix ]]; then
    x11_env_args+=(-e "DISPLAY=${DISPLAY}")
    x11_mounts+=(-v "/tmp/.X11-unix:/tmp/.X11-unix:rw")

    if [[ -f "${HOME}/.Xauthority" ]]; then
      x11_mounts+=(-v "${HOME}/.Xauthority:/home/dev/.Xauthority:ro")
      x11_env_args+=(-e "XAUTHORITY=/home/dev/.Xauthority")
    fi

    if command -v xhost >/dev/null 2>&1; then
      xhost +SI:localuser:"$(id -un)" >/dev/null 2>&1 || true
    fi
  fi

  podman run -d \
    --name "${name}" \
    --init \
    --userns=keep-id \
    --cap-drop=ALL \
    "${network_args[@]}" \
    -e BAZELISK_HOME=/home/dev/.cache/bazelisk \
    -e CLAUDE_CONFIG_DIR=/home/dev/.claude \
    -e PI_CODING_AGENT_SESSION_DIR="/home/dev/.pi/agent/sessions-${name}" \
    -e AGENTBOX_REPO_DIR="${repo_dir}" \
    -e TERM="${TERM}" \
    -e COLORTERM="${COLORTERM:-truecolor}" \
    -e PATH="/home/dev/.agentbox/tools/bin:/home/linuxbrew/.linuxbrew/bin:/home/linuxbrew/.linuxbrew/sbin:/usr/local/bin:/usr/bin:/bin" \
    "${x11_env_args[@]}" \
    -v "${repo_dir}:${repo_dir}" \
    -v "${name}-home:/home/dev" \
    -v "${bazel_disk_cache}:/var/tmp/bazel-disk-cache" \
    -v "${bazel_repository_cache}:/var/tmp/bazel-repository-cache" \
    -v "${HOME}/.cache/bazelisk:/home/dev/.cache/bazelisk" \
    "${secret_envs[@]}" \
    "${port_args[@]}" \
    "${extra_mount_args[@]}" \
    "${x11_mounts[@]}" \
    "${pi_mounts[@]}" \
    "${dotfile_mounts[@]}" \
    "${image}" \
    "sleep infinity" >/dev/null

  attach_exec "${name}"
}

attach_cmd() {
  local name=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --name) name="$2"; shift 2 ;;
      -h|--help) usage; exit 0 ;;
      *) echo "Unknown arg for attach: $1" >&2; usage >&2; exit 1 ;;
    esac
  done
  [[ -n "${name}" ]] || { echo "--name is required" >&2; exit 1; }
  attach_exec "${name}"
}

list_cmd() {
  podman ps -a --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
}

remove_cmd() {
  local name=""
  local with_home=0
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --name) name="$2"; shift 2 ;;
      --with-home-volume) with_home=1; shift ;;
      -h|--help) usage; exit 0 ;;
      *) echo "Unknown arg for remove: $1" >&2; usage >&2; exit 1 ;;
    esac
  done
  [[ -n "${name}" ]] || { echo "--name is required" >&2; exit 1; }

  if podman container exists "${name}"; then
    podman rm -f "${name}" >/dev/null
    echo "Removed container: ${name}"
  else
    echo "No container named '${name}'"
  fi

  if [[ ${with_home} -eq 1 ]]; then
    if podman volume exists "${name}-home"; then
      podman volume rm "${name}-home" >/dev/null
      echo "Removed volume: ${name}-home"
    else
      echo "No volume named '${name}-home'"
    fi
  fi
}

main() {
  local cmd="${1:-}"
  [[ $# -gt 0 ]] && shift || true

  case "${cmd}" in
    create) create_cmd "$@" ;;
    attach) attach_cmd "$@" ;;
    list) list_cmd "$@" ;;
    remove) remove_cmd "$@" ;;
    -h|--help|"") usage ;;
    *)
      echo "Unknown command: ${cmd}" >&2
      usage >&2
      exit 1
      ;;
  esac
}

main "$@"
