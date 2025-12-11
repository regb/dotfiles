return {
    { "stevearc/conform.nvim", lazy = true },
    {
        "mason-org/mason-lspconfig.nvim",
        opts = {},
        lazy = false,
        dependencies = {
            { "mason-org/mason.nvim", opts = {} },
            "neovim/nvim-lspconfig",
        },
        config = function()
            require("mason-lspconfig").setup {
                automatic_enable = {
                    exclude = {
                        "gopls",
                    }
                }
            }

            --        --lspconfig.eslint.setup {
            --        --    settings = {
            --        --        format = false
            --        --    }
            --        --}
            --        --local on_attach = require("plugins.configs.lspconfig").on_attach
            --        --local capabilities = require("plugins.configs.lspconfig").capabilities

            vim.api.nvim_create_autocmd('LspAttach', {
                callback = function()
                    local ft = vim.bo.filetype
                    if ft == "typescript" or ft == "javascript" or ft == "typescriptreact" or ft == "javascriptreact" then
                        -- For js/ts, we want to use prettier with conform and not the LSP formatting, so we override few things.
                        vim.keymap.set("n", "<leader>f", function() require('conform').format() end)
                        vim.bo.formatexpr = "v:lua.require'conform'.formatexpr()"

                        -- todo: could use the filter to select which lsp to use depending on filetype?
                        --vim.lsp.buf.format {
                        --    filter = function(client) return client.name ~= "ts_ls" end
                        --}
                    else
                        vim.keymap.set("n", "<leader>f", function() vim.lsp.buf.format() end)
                    end
                end
            })
        end
    },
    {
        "folke/lazydev.nvim",
        ft = "lua",
        opts = {
            library = {
                -- See the configuration section for more details
                -- Load luvit types when the `vim.uv` word is found
                { path = "${3rd}/luv/library", words = { "vim%.uv" } },
            },
        },
    },
    --
    --
    --        "stevearc/conform.nvim"
    --        require("conform").setup({
    --            formatters_by_ft = {
    --                --lua = { "stylua" },
    --                -- Conform will run multiple formatters sequentially
    --                --python = { "isort", "black" },
    --                -- You can customize some of the format options for the filetype (:help conform.format)
    --                --rust = { "rustfmt", lsp_format = "fallback" },
    --                -- Conform will run the first available formatter
    --                --javascript = { "prettierd", "prettier", stop_after_first = true },
    --                javascript = { "prettierd", "prettier", stop_after_first = true },
    --                typescript = { "prettierd", "prettier", stop_after_first = true },
    --                typescriptreact = { "prettierd", "prettier", stop_after_first = true },
    --                javascriptreact = { "prettierd", "prettier", stop_after_first = true },
    --            },
    --        })
    --
    --    end,
    --}
}
