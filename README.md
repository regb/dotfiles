# DotFiles

## Setup on new machine

Clone this repo in a workspace area on a machine, typically something like ~/vcs.

Backup (or delete) any local system configs that you want to import from this repo.

Then set up symlinks from expected config locations towards the right folder or file in this git repo.
E.g, assuming clone in `~/vcs/dotfiles`:


    ln -s ~/vcs/dotfiles/.config/nvim ~/.config/nvim
