return {
	"nvimtools/none-ls.nvim",
	config = function()
		local null_ls = require("null-ls")
		null_ls.setup({
			sources = {
				-- lua
				null_ls.builtins.formatting.stylua,
				-- c#
				null_ls.builtins.diagnostics.semgrep,
				null_ls.builtins.formatting.csharpier,
				-- prettier
				null_ls.builtins.formatting.prettier,
				-- spellchecker
				null_ls.builtins.diagnostics.codespell,
				-- cpp
				null_ls.builtins.formatting.clang_format,
				-- python
				null_ls.builtins.formatting.isort,
				null_ls.builtins.formatting.black,
			},
		})
	end,
}
