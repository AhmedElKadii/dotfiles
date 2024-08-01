-- indent settings
vim.cmd("set noexpandtab")
vim.cmd("set tabstop=4")
vim.cmd("set shiftwidth=4")

-- side numbers
vim.cmd("set number")
vim.cmd("set norelativenumber")
vim.cmd("set nocursorline")

-- Create an autocommand group to handle highlighting
vim.cmd([[
    augroup CursorLineNrHighlight
        autocmd!
        " Define highlight group for current line number
        autocmd WinEnter,BufEnter,CursorMoved * highlight CursorLineNr guifg=#D99D00 guibg=NONE
        " Enable cursorline with number highlighting
        autocmd WinEnter,BufEnter,CursorMoved * setlocal cursorline | setlocal cursorlineopt=number
        " Disable cursorline when the window is inactive
        autocmd WinLeave,BufLeave * setlocal nocursorline
    augroup END
]])

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
vim.cmd("set scrolloff=3")

-- vim specifics
vim.cmd("set encoding=UTF-8")
vim.env.DOTNET_ROOT = '/usr/local/share/dotnet'
-- Enable the title of the terminal window
vim.cmd("set title")

-- Define a Lua function to update the title with the file name
function set_title()
    local filename = vim.fn.expand('%:t')  -- Get the base name of the file
	if filename == "" then
		filename = "[No Name]"
	elseif filename == "NvimTree_1" then
		filename = "File Explorer"
	end
    vim.opt.titlestring = filename .. ' - nvim'
end

-- Call the function initially to set the title
set_title()

-- Update the title when the file changes
vim.api.nvim_create_autocmd("BufEnter", {
    callback = function()
        set_title()
    end
})

-- theme
vim.cmd.colorscheme "gruvbox"
