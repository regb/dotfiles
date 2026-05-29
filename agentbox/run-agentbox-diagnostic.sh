#!/usr/bin/env bash
set -euo pipefail

AGENTBOX_SH="${HOME}/.dotfiles/agentbox/run-agentbox.sh"
NAME="${AGENTBOX_DIAGNOSTIC_NAME:-diagnostic}"
IMAGE="${AGENTBOX_DIAGNOSTIC_IMAGE:-agentbox-diagnostic:latest}"

usage() {
  cat <<EOF
Usage:
  $(basename "$0") create [options] [REPO_DIR]
  $(basename "$0") attach
  $(basename "$0") remove [--with-home-volume]

Options for create:
  --kubeconfig PATH      Mount kubeconfig to /home/dev/.kube/config (ro)
  --aws-dir PATH         Mount AWS config/credentials dir to /home/dev/.aws (ro)
  --gcloud-key PATH      Mount gcloud service-account key to /tmp/gcloud-key.json (ro)
  --host-network         Use host network
  --mount SRC:DST[:OPT]  Extra mount (repeatable)
  --port HOST:CONT       Port mapping (repeatable)
EOF
}

cmd="${1:-attach}"
[[ $# -gt 0 ]] && shift || true

case "${cmd}" in
  create)
    args=(create --name "${NAME}" --image "${IMAGE}")
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --kubeconfig)
          args+=(--mount "$2:/home/dev/.kube/config:ro,z"); shift 2 ;;
        --aws-dir)
          args+=(--mount "$2:/home/dev/.aws:ro,z"); shift 2 ;;
        --gcloud-key)
          args+=(--mount "$2:/tmp/gcloud-key.json:ro,z"); shift 2 ;;
        --host-network|--mount|--port|--image|--name)
          args+=("$1" "$2"); shift 2 ;;
        -h|--help)
          usage; exit 0 ;;
        --)
          shift; break ;;
        *)
          args+=("$1"); shift ;;
      esac
    done
    exec "${AGENTBOX_SH}" "${args[@]}" "$@"
    ;;
  attach)
    exec "${AGENTBOX_SH}" attach --name "${NAME}"
    ;;
  remove)
    exec "${AGENTBOX_SH}" remove --name "${NAME}" "$@"
    ;;
  -h|--help)
    usage
    ;;
  *)
    echo "Unknown command: ${cmd}" >&2
    usage >&2
    exit 1
    ;;
esac
