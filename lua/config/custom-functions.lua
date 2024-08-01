-- general
-- Custom function to execute the command based on file extension
function new_script(path, filename, type)
    -- Determine the file extension from the filename
    local ext = filename:match("^.+(%..+)$")  -- Extract the file extension

    if ext == ".cs" then
        CreateUnityCSharpScript(filename)
    elseif ext == ".gd" then
        CreateGodotGDScript(path, filename, type)
    else
        print("Unsupported file type for script creation.")
    end
end

vim.api.nvim_create_user_command(
    'NewScript',
    function(opts)
        local args = vim.split(opts.args, ' ', true)  -- Split arguments by spaces
        local path = args[1] or ""
        local filename = args[2] or ""
        local type = args[3] or ""  -- Only needed for Godot scripts

        new_script(path, filename, type)
    end,
    { nargs = '*', complete = 'file' }
)

-- unity
-- Custom function to create a new Unity C# script with default boilerplate code
function CreateUnityCSharpScript(filename)
    if not filename:match(".cs$") then
        filename = filename .. ".cs"
    end
    local path = 'Assets/Scripts/' .. filename
    local file = io.open(path, 'w')

    if file then
        file:write(
          "using UnityEngine;\n\n" ..
          "public class " .. filename:gsub('.cs', '') .. " : MonoBehaviour\n" ..
          "{\n" ..
          "    void Start()\n" ..
          "    {\n" ..
          "        \n" ..
          "    }\n\n" ..
          "    void Update()\n" ..
          "    {\n" ..
          "        \n" ..
          "    }\n" ..
          "}\n"
        )
        file:close()
        print('Created new script: ' .. path)
        vim.cmd('e ' .. path)
    else
        print('Failed to create file: ' .. path)
    end
end

vim.api.nvim_create_user_command(
    'NewUnityScript',
    function(opts)
        CreateUnityCSharpScript(opts.args)
    end,
    { nargs = 1, complete = 'file' }
)

-- godot
-- Custom function to check if we are in a Godot project
local gdproject = io.open(vim.fn.getcwd()..'/project.godot', 'r')
if gdproject then
    io.close(gdproject)
    vim.fn.serverstart './godothost'
end

-- Custom function to create a new Godot GDScript with default boilerplate code
function CreateGodotGDScript(path, filename, type)
    if not filename:match(".gd$") then
        filename = filename .. ".gd"
    end
    local fullPath = path .. filename
    local file = io.open(fullPath, 'w')

    if file then
        file:write("extends " .. type .. "\n\n"
        .. "func _ready():\n"
        .. "    pass\n\n"
        .. "func _process(delta):\n"
        .. "    pass\n"
        )
        file:close()
        print('Created new script: ' .. fullPath)
        vim.cmd('e ' .. fullPath)
    else
        print('Failed to create file: ' .. fullPath)
    end
end

vim.api.nvim_create_user_command(
    'NewGodotScript',
    function(opts)
        local args = vim.split(opts.args, ' ', true)  -- Split arguments by spaces
        local path = args[1] or ""
        local filename = args[2] or ""
        local type = args[3] or "Node2D"  -- Default type if not provided

        CreateGodotGDScript(path, filename, type)
    end,
    { nargs = '*', complete = 'file' }
)
