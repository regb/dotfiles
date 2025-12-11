-- vim.cmd("let g:netrw_liststyle = 3")

vim.api.nvim_create_autocmd("TextYankPost", {
  desc = "Highlight when yanking text",
  group = vim.api.nvim_create_augroup("regb-highlight-yank", { clear = true }),
  callback = function()
    vim.highlight.on_yank()
  end
})
