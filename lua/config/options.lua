-- indent settings
vim.cmd("set noexpandtab")
vim.cmd("set tabstop=4")
vim.cmd("set shiftwidth=4")

-- side numbers
vim.cmd("set number")
vim.cmd("set norelativenumber")

-- clipboard
vim.cmd("set clipboard^=unnamed")

-- Define empty signs for diagnostics to hide the letters in the gutter
vim.fn.sign_define("DiagnosticSignError", { text = "", numhl = "DiagnosticSignError" })
vim.fn.sign_define("DiagnosticSignWarn", { text = "", numhl = "DiagnosticSignWarn" })
vim.fn.sign_define("DiagnosticSignInfo", { text = "", numhl = "DiagnosticSignInfo" })
vim.fn.sign_define("DiagnosticSignHint", { text = "", numhl = "DiagnosticSignHint" })

-- fundo
vim.o.undofile = true

-- quality of life
vim.cmd("set showtabline=0")

-- vim specifics
vim.cmd("set encoding=UTF-8")

-- theme
vim.cmd.colorscheme "gruvbox"
