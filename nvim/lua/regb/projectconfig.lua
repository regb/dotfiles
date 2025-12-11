local M = {}

-- This autoloads an `.nvim.lua` in the working directory (a project-local config).
-- Each folder needs to be explicitly white-listed so on first load neovim will ask
-- to accept it. The list of whitelisted directories will be in ~/.local/share/nvim/.nvim-whitelist.

-- Read whitelist from file
local function read_whitelist(whitelist_file)
  local whitelist = {}

  if vim.fn.filereadable(whitelist_file) == 0 then
    return whitelist
  end

  for line in io.lines(whitelist_file) do
    -- Skip empty lines and comments
    if line:match("%S") and not line:match("^%s*#") then
      local dir = line:match("^%s*(.-)%s*$") -- trim whitespace
      whitelist[dir] = true
    end
  end

  return whitelist
end

-- Add directory to whitelist
local function add_to_whitelist(whitelist_file, directory)
  local file = io.open(whitelist_file, "a")
  if not file then
    return false, "Failed to open whitelist file for writing"
  end

  file:write(directory .. "\n")
  file:close()
  return true
end

-- Check if directory is whitelisted, prompt if not
local function check_and_load(config_file, directory)
  local data_dir = vim.fn.stdpath("data")
  local whitelist_file = data_dir .. "/.nvim-whitelist"

  -- Read current whitelist
  local whitelist = read_whitelist(whitelist_file)

  -- If whitelisted, load immediately
  if whitelist[directory] then
    local ok, err = pcall(dofile, config_file)
    if not ok then
      vim.notify("Error loading .nvim.lua: " .. err, vim.log.levels.ERROR)
    else
      vim.notify("Loaded .nvim.lua from " .. directory, vim.log.levels.INFO)
    end
    return
  end

  -- Not whitelisted, ask for confirmation
  vim.notify("Found .nvim.lua in: " .. directory, vim.log.levels.WARN)
  local choice = vim.fn.confirm(
    "Trust and add this directory to whitelist?",
    "&Yes\n&No",
    2 -- default to No
  )

  if choice == 1 then
    -- Add to whitelist
    local ok, err = add_to_whitelist(whitelist_file, directory)
    if not ok then
      vim.notify(err, vim.log.levels.ERROR)
      return
    end

    vim.notify("Added to whitelist: " .. directory, vim.log.levels.INFO)

    -- Load the config
    local load_ok, load_err = pcall(dofile, config_file)
    if not load_ok then
      vim.notify("Error loading .nvim.lua: " .. load_err, vim.log.levels.ERROR)
    else
      vim.notify("Loaded .nvim.lua from " .. directory, vim.log.levels.INFO)
    end
  else
    vim.notify("Skipped loading .nvim.lua from " .. directory, vim.log.levels.WARN)
  end
end

-- Setup autocmd for .nvim.lua autoloading
vim.api.nvim_create_autocmd("VimEnter", {
  callback = function()
    local cwd = vim.fn.getcwd()
    local project_config = cwd .. "/.nvim.lua"

    if vim.fn.filereadable(project_config) == 1 then
      check_and_load(project_config, cwd)
    end
  end,
})

return M
