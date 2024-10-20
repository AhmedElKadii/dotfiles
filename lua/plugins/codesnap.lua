return {
  "mistricky/codesnap.nvim",
  lazy = true,
  build = "make build_generator",
  opts = {
    save_path = "~/Pictures",
    has_breadcrumbs = true,
    bg_color = "#5f3833",
	watermark = "🖥️ 🌊",
	has_line_numbers = true,
  },
}
