vim.opt.number = true
vim.opt.relativenumber = true

vim.opt.wrap = false

vim.opt.tabstop = 4
vim.opt.softtabstop = 4
vim.opt.shiftwidth = 4
vim.opt.expandtab = true

vim.opt.smartindent = true

vim.opt.hlsearch = false
vim.opt.incsearch = true

vim.opt.termguicolors = true

vim.opt.inccommand = 'split'

vim.opt.splitright = true
vim.opt.splitbelow = true

vim.opt.scrolloff = 4

vim.opt.signcolumn = "yes"
vim.opt.colorcolumn = "80"

-- To be considered, but search with ignore case except when mixed case in
-- vim.opt.ignorecase = true
-- vim.opt.smartcase = true
--
vim.g.netrw_browse_split = 0
vim.g.netrw_banner = 0
vim.g.netrw_winsize = 25

vim.diagnostic.config({
    virtual_text = true

    --virtual_lines = true
    -- instead only show the diagnostic when cursor on the line.
    --virtual_lines = {
    --    current_line = true,
    --},
})
