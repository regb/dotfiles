PI agent config tracked in dotfiles.

Suggested setup keeps mutable runtime files (sessions, auth, binaries) out of this repo
by symlinking only stable config files.

Create local directories first:

```bash
mkdir -p ~/.pi/agent
```

Then link tracked files:

```bash
ln -sf ~/.dotfiles/pi/agent/settings.json ~/.pi/agent/settings.json
ln -sf ~/.dotfiles/pi/agent/keybindings.json ~/.pi/agent/keybindings.json
ln -sfn ~/.dotfiles/pi/agent/prompts ~/.pi/agent/prompts
ln -sfn ~/.dotfiles/pi/agent/extensions ~/.pi/agent/extensions
```
