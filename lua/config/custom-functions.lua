-- general
-- Custom function to determine project type and call the corresponding command
function determine_file_type(args)
    -- Check for Unity project indicator
    if vim.fn.filereadable('ProjectSettings/ProjectSettings.asset') == 1 then
        vim.cmd(string.format("NewUnityScript %s", args))
    -- Check for Godot project indicator
    elseif vim.fn.filereadable('project.godot') == 1 then
        vim.cmd(string.format("NewGodotScript %s", args))
    else
        print("Unsupported project type for script creation.")
    end
end

vim.api.nvim_create_user_command(
    'DetermineFileType',
    function(opts)
        determine_file_type(opts.args)
    end,
    { nargs = '*' }
)

-- unity
-- Custom function to check if we are in a Godot project
local unityproject = io.open(vim.fn.getcwd()..'/ProjectSettings/ProjectSettings.asset', 'r')
if unityproject then
    io.close(unityproject)
    vim.fn.serverstart '/tmp/nvimsocket'
end
-- Custom function to create a new Unity C# script with default boilerplate code
function CreateUnityCSharpScript(filename, classType)
    classType = classType or "MonoBehaviour"
    if not filename:match(".cs$") then
        filename = filename .. ".cs"
    end
    local path = 'Assets/Scripts/' .. filename
    local file = io.open(path, 'w')

    if file then
        file:write(
          "using UnityEngine;\n\n" ..
          "public class " .. filename:gsub('.cs', '') .. " : " .. classType .. "\n" ..
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
        local args = vim.split(opts.args, ' ', true)
        local filename = args[1] or ""
        local classType = args[2]

        CreateUnityCSharpScript(filename, classType)
    end,
    { nargs = '*' }
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
    type = type or "Node2D"
    if not filename:match(".gd$") then

        filename = filename .. ".gd"
    end
    local fullPath = path .. "/" .. filename
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
        local args = vim.split(opts.args, ' ', true)
        local path = args[1] or ""
        local filename = args[2] or ""
        local type = args[3]

        CreateGodotGDScript(path, filename, type)
    end,
    { nargs = '*' }
)
