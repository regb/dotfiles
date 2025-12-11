local M = {}

-- Setup gopls with auto-detection and config overrides
-- Called automatically on VimEnter (after project config loads)
local function setup()
  local config = require("regb.config")
  local root_dir = vim.fn.getcwd()

  -- Always auto-detect Bazel projects
  local is_bazel = vim.fn.filereadable(root_dir .. '/MODULE.bazel') == 1 or
                   vim.fn.filereadable(root_dir .. '/WORKSPACE') == 1

  local gopls_settings = {}

  if is_bazel then
    gopls_settings.workspaceFiles = {
      "**/BUILD",
      "**/WORKSPACE",
      "**/*.{bzl,bazel}",
    }

    -- Exclude bazel-* directories
    local bazel_dirs = {}
    for _, dir in ipairs(vim.fn.glob(root_dir .. '/bazel-*', false, true)) do
      local basename = vim.fn.fnamemodify(dir, ':t')
      table.insert(bazel_dirs, '-' .. basename)
    end
    gopls_settings.directoryFilters = bazel_dirs
  end

  -- Set gopackagesdriver only if path provided AND file exists
  if config.gopls.gopackagesdriver_path and
     vim.fn.filereadable(config.gopls.gopackagesdriver_path) == 1 then
    gopls_settings.env = {
      GOPACKAGESDRIVER = config.gopls.gopackagesdriver_path
    }
  end

  -- Merge extra settings from project config
  gopls_settings = vim.tbl_deep_extend("force", gopls_settings, config.gopls.extra_settings)

  -- Build LSP config
  local lsp_config = {
    root_dir = root_dir,
  }

  -- Only set settings if there are actual gopls settings to configure
  if next(gopls_settings) ~= nil then
    lsp_config.settings = {
      gopls = gopls_settings
    }
  end

  vim.lsp.config('gopls', lsp_config)
  vim.lsp.enable('gopls')
end

-- Register VimEnter autocmd - runs AFTER projectconfig's autocmd
-- because this module is required later in regb/init.lua
vim.api.nvim_create_autocmd("VimEnter", {
  callback = setup,
})

return M
