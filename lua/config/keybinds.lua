local map = vim.keymap.set
local unmap = vim.keymap.del

-- telescope
local builtin = require("telescope.builtin")
map('n', '<leader>ff', builtin.find_files, {})
map('n', '<leader>f', builtin.live_grep, {})

-- hop
map('n', ';', ':HopWord<CR>', {})

-- compile
map('n', '<F3>', ':lua Compile()<CR>', { noremap = true, silent = true })
-- compile and run
map('n', '<F5>', ':lua CompileAndRun()<CR>', { noremap = true, silent = true })

-- codesnap
map('x', '<C-s>', ':CodeSnap<CR>', {})
map('x', '<C-S-s>', ':CodeSnapSave<CR>', {})

-- minty
map('n', '<C-c>', ':Huefy<CR>', {})

-- debugging
map('n', '<F1>', function() require('dap').toggle_breakpoint() end)
map('n', '<F2>', function() require('dap').continue() end)

-- zathura
-- map('n', '<leader>z', ':!zathura %<CR>', { noremap = true, silent = true })
vim.api.nvim_set_keymap('n', '<leader>z', ':!zathura <C-r>=expand("%:p:r") .. ".pdf"<CR> &<CR>', { noremap = true, silent = true })

-- line moving
map('n', '<C-S-k>', 'VxkP', {})
map('n', '<C-S-j>', 'Vxp', {})
map('v', '<C-S-k>', 'xkP<Esc>', {})
map('v', '<C-S-j>', 'xp<Esc>', {})

-- indentation
map('n', '<C-S-h>', "<<", {})
map('n', '<C-S-l>', ">>", {})
map('v', '<C-S-h>', "<<<Esc>", {})
map('v', '<C-S-l>', ">><Esc>", {})

-- window management
-- switching
map('n', '<C-h>', '<C-W>h', {})
map('n', '<C-j>', '<C-W>j', {})
map('n', '<C-k>', '<C-W>k', {})
map('n', '<C-l>', '<C-W>l', {})

map('n', '<C-BS>', ':q<CR>', {})

-- buffer management
map('n', '--', ':bd<CR>', {})
map('n', '++', ':tabe<CR>', {})
-- switching
map('n', 'H', ':bprev<CR>', {})
map('n', 'L', ':bnext<CR>', {})
-- splitting
map('n', '|', ':vsplit<CR>', {})
map('n', '_', ':split<CR>', { noremap = true, silent = true })
-- TODO
-- todo
map('n', '<leader>ft', ':Trouble todo<CR>', {})

-- oil
map('n', '<leader>o', ':Oil<CR>', {})

-- arduino
vim.api.nvim_set_keymap('n', '<leader>au', ':!arduino-cli compile --upload<CR>', { noremap = true, silent = true })
vim.api.nvim_set_keymap('n', '<leader>ac', ':!arduino-cli compile<CR>', { noremap = true, silent = true })
vim.api.nvim_set_keymap('n', '<leader>sm', ':term screen /dev/ttyUSB0 9600<CR>', { noremap = true, silent = true })

-- chatgpt
-- map('n', '<leader>cc', ':ChatGPT<CR>', {}) -- don't have an api key yet

-- neotree
-- map('n', '<leader>e', ':Neotree toggle<CR>', {})

-- telescope file browser
-- map('n', '<leader>e', ':Telescope file_browser<CR>', {})

-- nvim tree
map('n', '<leader>e', ':NvimTreeToggle<CR>', {})

-- lsp
map('n', 'K', vim.lsp.buf.hover, {})
map('n', '<leader>gd', vim.lsp.buf.definition, {})
map('n', '<leader>ca', vim.lsp.buf.code_action, {})
map('n', '<leader>gr', vim.lsp.buf.references, {})
map('n', '<leader>F', vim.lsp.buf.format, {})

-- custom functions
map('n', '<leader>n', ':DetermineFileType ', { noremap = true, silent = true })

-- quality of life
map('n', '>', '<C-a>', {})
map('n', '<', '<C-x>', {})
map('n', '<C-a>', 'ggVG', {})
