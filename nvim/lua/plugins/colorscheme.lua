return {
    {
        "rebelot/kanagawa.nvim",
        dependencies = {
            "ellisonleao/gruvbox.nvim",
            "Mofiqul/dracula.nvim",
            "sainnhe/everforest",
            { "rose-pine/neovim", name = "rose-pine" },
            "savq/melange-nvim",
            "folke/tokyonight.nvim",
            "projekt0n/github-nvim-theme",
        },
        priority = 1000,
        config = function()
            --vim.cmd([[colorscheme kanagawa-wave]])
            --vim.cmd([[colorscheme gruvbox]])
            --vim.cmd([[colorscheme everforest]])
            --vim.cmd([[colorscheme melange]])
            --vim.cmd([[colorscheme rose-pine-moon]])
            --vim.cmd([[colorscheme dracula-soft]])
            vim.cmd([[colorscheme github_dark_high_contrast]])
        end,
    }
}
