local map = vim.keymap.set
local unmap = vim.keymap.del

-- telescope
local builtin = require("telescope.builtin")
map('n', '<C-p>', builtin.find_files, {})
map('n', '<leader>fg', builtin.live_grep, {})

-- line moving
map('n', '<C-S-k>', 'VxkP', {})
map('n', '<C-S-j>', 'Vxp', {})


-- indentation
map('n', '<C-,>', "<<", {})
map('n', '<C-.>', ">>", {})

-- window management
-- switching
map('n', '<C-h>', '<C-W>h', {})
map('n', '<C-j>', '<C-W>j', {})
map('n', '<C-k>', '<C-W>k', {})
map('n', '<C-l>', '<C-W>l', {})
-- splitting
map('n', '<C-\\>', ':vsplit<CR>', {})
map('n', '<C-=>', ':split<CR>', { noremap = true, silent = true })

-- buffer switching
map('n', 'H', ':bprev<CR>', {})
map('n', 'L', ':bnext<CR>', {})
map('n', 'N', ':tabe<CR>', {})

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

-- quality of life
map('n', '<C-a>', 'ggVG', {})
