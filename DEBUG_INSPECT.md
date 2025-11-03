# Debugging :Inspect Not Finding Highlights

## Step 1: Verify File Type Detection
Open a .brs file in neovim and run:
```vim
:set filetype?
```
It should show: `filetype=brightscript`

If not, the file type detection isn't working.

## Step 2: Verify Parser is Loaded
```vim
:lua print(require('vim.treesitter').get_parser():lang())
```
It should print: `brightscript`

If it errors or shows a different language, the parser isn't loaded.

## Step 3: Check Runtimepath
```vim
:lua for _, p in ipairs(vim.opt.runtimepath:get()) do if string.find(p, "tree-sitter") then print(p) end end
```
You should see paths that include:
- `/Users/jordan.fjellman/code/oss/tree-sitter/tree-sitter-brightscript`
- `/Users/jordan.fjellman/code/oss/tree-sitter`

## Step 4: Check if Highlights Query Exists
```vim
:lua 
local f = io.open("/Users/jordan.fjellman/code/oss/tree-sitter/tree-sitter-brightscript/queries/brightscript/highlights.scm", "r")
if f then print("✓ File exists") f:close() else print("✗ File NOT found") end
```

## Step 5: Try to Load Highlights Query
```vim
:lua
local ok, query = pcall(function()
  return require("vim.treesitter.query").get("brightscript", "highlights")
end)
if ok then
  print("✓ Query loaded: " .. tostring(query))
else
  print("✗ Query failed: " .. tostring(query))
end
```

## Step 6: Manually Execute Query
```vim
:lua
local ts = require("vim.treesitter")
local query = require("vim.treesitter.query").get("brightscript", "highlights")
local parser = ts.get_parser()
local tree = parser:parse()[1]
local buftext = vim.api.nvim_buf_get_lines(0, 0, -1, false)
local text = table.concat(buftext, "\n")
local count = 0
for id, node in query:iter_captures(tree:root(), text) do
  count = count + 1
end
print("Found " .. count .. " captures")
```

## Step 7: Check nvim-treesitter Highlight Status
```vim
:lua
local configs = require("nvim-treesitter.configs")
local status = configs.get_module("highlight")
print("Highlight status: " .. vim.inspect(status))
```

## Solutions if These Checks Fail

### If step 1 fails (filetype not set):
- Check ~/.config/nvim/ftdetect/brightscript.lua exists and has correct content
- Restart neovim completely

### If step 2 fails (parser not loaded):
- Run `:TSUninstall brightscript` then `:TSInstall brightscript`
- Or restart neovim

### If steps 3-4 fail (runtimepath/query not found):
- Check that init.lua has the prepend line for tree-sitter-brightscript
- Verify queries/brightscript/highlights.scm exists in the project

### If step 5 fails (query won't load):
- There might be a syntax error in highlights.scm
- Try: `tree-sitter query queries/brightscript/highlights.scm` from project directory

### If step 6 fails (query returns no captures):
- The query isn't matching any nodes
- Could be a grammar issue or capture name issue

### If step 7 shows highlights disabled:
- Add `highlight = { enable = true }` to treesitter config
