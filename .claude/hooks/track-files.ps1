# Hook PostToolUse : note les fichiers modifies pendant la tache en cours.
# Ecrit un chemin par ligne dans .claude/session-buffers/<session_id>.txt
$ErrorActionPreference = "Stop"

try {
    $raw  = [Console]::In.ReadToEnd()
    $data = $raw | ConvertFrom-Json
} catch { exit 0 }

$toolName = $data.tool_name
if ($toolName -ne "Write" -and $toolName -ne "Edit" -and $toolName -ne "NotebookEdit") { exit 0 }

$filePath = $data.tool_input.file_path
if (-not $filePath) { exit 0 }

$sessionId  = if ($data.session_id) { $data.session_id } else { "default" }
$projectDir = if ($env:CLAUDE_PROJECT_DIR) { $env:CLAUDE_PROJECT_DIR } else { (Get-Location).Path }

$bufferDir = Join-Path $projectDir ".claude\session-buffers"
if (-not (Test-Path $bufferDir)) { New-Item -ItemType Directory -Force -Path $bufferDir | Out-Null }
$bufferFile = Join-Path $bufferDir "$sessionId.txt"

$existing = @()
if (Test-Path $bufferFile) { $existing = @(Get-Content $bufferFile -Encoding UTF8) }

if ($existing -notcontains $filePath) {
    Add-Content -Path $bufferFile -Value $filePath -Encoding UTF8
}

exit 0
