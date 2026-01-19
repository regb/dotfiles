# DotFiles

## Setup on new machine

Clone this repo in a workspace area on a machine, typically something like ~/.dotfiles:

    cd
    git clone https://github.com/regb/dotfiles.git .dotfiles

Backup (or delete) any local system configs that you want to import from this repo.

Then set up symlinks from expected config locations towards the right folder or
file in this git repo. E.g, assuming clone in `~/vcs/.dotfiles`:

## Neovim

    ln -s ~/.dotfiles/nvim ~/.config/nvim

## Tmux

    ln -s ~/.dotfiles/tmux/.tmux.conf ~/.tmux.conf

## Bash setup

Append to your `.bashrc` the following extra environment setup:

    . "$HOME/.dotfiles/bash/env.sh"


## opencode

Opencode has a main system config that is global:

    ln -s ~/.dotfiles/opencode ~/.config/opencode

And also some project specific configs that I'm using in large projects where these
cannot be checked in due to conflicts with other people preferences. The general
idea is to check in some subset of the project config which are established (respecting
coding pattern, git message format, build/test, etc), but there additional workflows
that are unique to how I work and wouldn't make sense shared with others. To
use these, you need to export `OPENCODE_CONFIG_DIR` custom directory path (additional
config that gets merged into the default one) in the workspace where opencode is
used, with a personal name that is gitignored in that folder:

    export OPENCODE_CONFIG_DIR="path/to/project/.regb.opencode"

Then custom opencode configs can be symlinked to that path:

    ln -s ~/.dotfiles/opencode-nf path/to/project/.regb.opencode

## Git

I maintained my global `.gitignore`:

    ln -s ~/.dotfiles/git/.gitignore ~/.gitignore 
