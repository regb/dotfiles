local M = {}

M.gopls = {
  gopackagesdriver_path = nil,  -- Path to gopackagesdriver.sh (validated at setup)
  extra_settings = {},          -- Additional gopls settings to merge
}

return M
