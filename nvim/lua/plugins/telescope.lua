return {
  { 
      "nvim-telescope/telescope.nvim",
      dependencies = { "nvim-lua/plenary.nvim" },
      config = function()

        local builtin = require('telescope.builtin')
        
        -- Using 'p' as prefix for 'project'-related commands.
        vim.keymap.set('n', '<leader>pf', function () builtin.find_files({ hidden = true }) end, { desc = 'Project Files' })
        vim.keymap.set('n', '<leader>ps', builtin.live_grep, { desc = 'Project Search' })
        vim.keymap.set('n', '<leader>pg', builtin.grep_string, { desc = 'Project Grep' })
        
        -- Using 'b' for buffer related commands
        vim.keymap.set('n', '<leader>bf', builtin.buffers, { desc = 'Find buffers' })
        
        -- Using 'h' for help related commands
        vim.keymap.set('n', '<leader>hf', builtin.help_tags, { desc = 'Search Help tags' })
    end
  },
}
