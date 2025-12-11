require("regb.remap")
require("regb.options")
require("regb.cmds")
require("regb.projectconfig")  -- Defines VimEnter autocmd first
require("regb.gopls")          -- Defines VimEnter autocmd second (runs after)

require("regb.lazy")
