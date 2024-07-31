return {
	"ellisonleao/gruvbox.nvim",
	priority = 1000,
	opts = {
		styles = {
			float = "transparent",
		},
	},
	config = function()
		require("gruvbox").setup({
        overrides = {
          -- Customize specific highlights
          NormalFloat = { bg = "NONE" },
          FloatBorder = { bg = "NONE" },
          Pmenu = { bg = "NONE" },
          PmenuSel = { bg = "#3c3836" }, -- Match Gruvbox background
          -- Add more highlight groups as needed
        }
		})
	end,
}
