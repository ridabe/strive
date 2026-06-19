$ErrorActionPreference = "Stop"

$nodePath = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter node.exe |
  Where-Object { $_.FullName -match "node-v[0-9]+\.[0-9]+\.[0-9]+-win-x64\\node\.exe$" } |
  Sort-Object FullName -Descending |
  Select-Object -ExpandProperty FullName -First 1

if (-not $nodePath) {
  $nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
  $nodePath = if ($nodeCommand) { $nodeCommand.Source } else { $null }
}

if (-not $nodePath) {
  throw "Node.js nao foi encontrado. Instale/repare o Node.js ou informe o caminho de node.exe."
}

& $nodePath "$PSScriptRoot\create-global-admin.mjs"
