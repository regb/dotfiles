# Editor configuration
export EDITOR=nvim
alias vim="nvim"

# Bash settings
set -o emacs

# History management
export PROMPT_COMMAND='history -a'

command -v direnv >/dev/null 2>&1 && eval "$(direnv hook bash)"

