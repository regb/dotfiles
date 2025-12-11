vim.g.mapleader = " "
vim.g.maplocalleader = " "

vim.keymap.set("n", "<leader>pv", vim.cmd.Ex)

-- Delete a buffer but keep the window open and swap to last buffer.
vim.keymap.set('n', '<leader>bd', ':b#<CR>:bd#<CR>', { desc = 'Find buffers' })

-- Let's never use Q, it's just painful.
vim.keymap.set("n", "Q", "<nop>")

-- TODO: define a ctrl-f to use tmux-sessionizer (with !tmux) and swap to another tmux session

-- From primeagen, move lines around.
vim.keymap.set("v", "J", ":m '>+1<CR>gv=gv")
vim.keymap.set("v", "K", ":m '<-2<CR>gv=gv")

vim.keymap.set("n", "<C-d>", "<C-d>zz")
vim.keymap.set("n", "<C-u>", "<C-u>zz")
--vim.keymap.set("n", "n", "nzzzv")
--vim.keymap.set("n", "N", "Nzzzv")


-- TODO: where is the other leader s prefix? This takes a while to take effect
vim.keymap.set("n", "<leader>s", [[:%s/\<<C-r><C-w>\>/<C-r><C-w>/gI<Left><Left><Left>]])
