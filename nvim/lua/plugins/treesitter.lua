return {
    {
        'nvim-treesitter/nvim-treesitter',
        lazy = false,
        dependencies = {
            { "nvim-treesitter/nvim-treesitter-textobjects", branch = 'main' },
            "nvim-treesitter/nvim-treesitter-context"
        },
        branch = 'main',
        build = ':TSUpdate',
        config = function()
            require('nvim-treesitter').install { "go", "typescript", "javascript", "rust", "helm",
                "vim", "markdown_inline", "html", "css", "scss", "python",
                "json", "yaml", "scala", "c_sharp", "terraform", "dockerfile", "bash",
                "tsx", "starlark" }

            vim.api.nvim_create_autocmd('FileType', {
                --pattern = { '<filetype>' },
                callback = function(args)
                    local filetype = vim.bo[args.buf].filetype
                    if filetype == nil or filetype == "" then
                        return
                    end

                    local lang = vim.treesitter.language.get_lang(filetype)
                    if not lang then
                        return
                    end

                    if vim.treesitter.language.add(lang) then
                        vim.treesitter.start(args.buf, lang)

                        -- Enable once tested where it works better than builtin indent
                        -- vim.bo.indentexpr = "v:lua.require'nvim-treesitter'.indentexpr()"

                        -- Understand folding better.
                        vim.wo.foldmethod = 'expr'
                        vim.wo.foldexpr = 'v:lua.vim.treesitter.foldexpr()'
                        vim.wo.foldlevel = 99
                        vim.o.foldlevelstart = 99
                    end
                end
            })

            -- configuration
            require("nvim-treesitter-textobjects").setup {
                select = {
                    -- Automatically jump forward to textobj, similar to targets.vim
                    lookahead = true,
                    -- You can choose the select mode (default is charwise 'v')
                    --
                    -- Can also be a function which gets passed a table with the keys
                    -- * query_string: eg '@function.inner'
                    -- * method: eg 'v' or 'o'
                    -- and should return the mode ('v', 'V', or '<c-v>') or a table
                    -- mapping query_strings to modes.
                    selection_modes = {
                        ['@parameter.outer'] = 'v', -- charwise
                        ['@function.outer'] = 'V',  -- linewise
                        ['@class.outer'] = '<c-v>', -- blockwise
                    },
                    -- If you set this to `true` (default is `false`) then any textobject is
                    -- extended to include preceding or succeeding whitespace. Succeeding
                    -- whitespace has priority in order to act similarly to eg the built-in
                    -- `ap`.
                    --
                    -- Can also be a function which gets passed a table with the keys
                    -- * query_string: eg '@function.inner'
                    -- * selection_mode: eg 'v'
                    -- and should return true of false
                    include_surrounding_whitespace = false,
                },
            }

            vim.keymap.set({ "x", "o" }, "af", function()
                require "nvim-treesitter-textobjects.select".select_textobject("@function.outer", "textobjects")
            end)
            vim.keymap.set({ "x", "o" }, "if", function()
                require "nvim-treesitter-textobjects.select".select_textobject("@function.inner", "textobjects")
            end)
            vim.keymap.set({ "x", "o" }, "ac", function()
                require "nvim-treesitter-textobjects.select".select_textobject("@class.outer", "textobjects")
            end)
            vim.keymap.set({ "x", "o" }, "ic", function()
                require "nvim-treesitter-textobjects.select".select_textobject("@class.inner", "textobjects")
            end)
            -- You can also use captures from other query groups like `locals.scm`
            vim.keymap.set({ "x", "o" }, "as", function()
                require "nvim-treesitter-textobjects.select".select_textobject("@local.scope", "locals")
            end)

            vim.filetype.add({
                pattern = {
                    [".*/templates/.*%.tpl"] = "helm",
                    [".*/templates/.*%.ya?ml"] = "helm",
                    ["helmfile.*%.ya?ml"] = "helm",
                },
            })

            require 'treesitter-context'.setup {
                enable = true,
                multiwindow = false,
                max_lines = 2,            -- How many lines the window should span. Values <= 0 mean no limit. TODO: per-language set
                min_window_height = 0,
                line_numbers = true,
                multiline_threshold = 20, -- Maximum number of lines to show for a single context
                trim_scope = 'outer',     -- Which context lines to discard if `max_lines` is exceeded. Choices: 'inner', 'outer'
                mode = 'cursor',
                separator = nil,
                zindex = 20,
                on_attach = nil,
            }
        end
    },
}
