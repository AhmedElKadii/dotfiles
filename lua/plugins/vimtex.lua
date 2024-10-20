return {
  "lervag/vimtex",
  lazy = false,
  init = function()
	vim.g.tex_conceal = 'abdmg'
	vim.g.vimtex_view_method = 'zathura'
	vim.g.vimtex_toc_config = {
		name = 'ToC',
		layers = { 'content', 'todo', 'include' },
		show_help = false
	}
	vim.g.tex_superscripts= "[0-9a-zA-W.,:;+-<>/()=]"
	vim.g.tex_subscripts= "[0-9aehijklmnoprstuvx,+-/().]"
	vim.g.tex_conceal_frac=1
  end
}
