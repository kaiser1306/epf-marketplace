# Hook Stop : cree une fiche markdown dans docs/ pour la tache qui vient de se terminer.
# Contenu : demande de l'utilisateur + liste des fichiers modifies pendant la tache.
$ErrorActionPreference = "Stop"

try {
    $raw  = [Console]::In.ReadToEnd()
    $data = $raw | ConvertFrom-Json
} catch { exit 0 }

$sessionId      = if ($data.session_id) { $data.session_id } else { "default" }
$transcriptPath = $data.transcript_path
$projectDir     = if ($env:CLAUDE_PROJECT_DIR) { $env:CLAUDE_PROJECT_DIR } else { (Get-Location).Path }

$bufferFile = Join-Path $projectDir ".claude\session-buffers\$sessionId.txt"
if (-not (Test-Path $bufferFile)) { exit 0 }

$touched = @(Get-Content $bufferFile -Encoding UTF8 | Where-Object { $_.Trim() -ne "" })
if ($touched.Count -eq 0) {
    Remove-Item $bufferFile -Force -ErrorAction SilentlyContinue
    exit 0
}

# -- Derniere demande utilisateur depuis le transcript (JSONL) --
function Get-LastUserMessage($path) {
    if (-not $path -or -not (Test-Path $path)) { return "" }
    $last = ""
    foreach ($line in Get-Content $path -Encoding UTF8) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        try { $entry = $line | ConvertFrom-Json } catch { continue }
        if ($entry.type -ne "user") { continue }
        $content = $entry.message.content
        $text = ""
        if ($content -is [string]) {
            $text = $content
        } elseif ($content) {
            foreach ($block in $content) {
                if ($block.type -eq "text") { $text += " " + $block.text }
            }
        }
        $text = $text.Trim()
        if ($text -ne "") { $last = $text }
    }
    return $last
}

# -- Slug sans accents pour le nom de fichier --
function Get-Slug($text) {
    if (-not $text) { return "tache" }
    $s = $text.Normalize([System.Text.NormalizationForm]::FormD)
    $s = [System.Text.RegularExpressions.Regex]::Replace($s, '\p{M}', '')
    $s = $s.ToLower()
    $s = [System.Text.RegularExpressions.Regex]::Replace($s, '[^a-z0-9\s-]', '')
    $s = [System.Text.RegularExpressions.Regex]::Replace($s, '\s+', '-').Trim('-')
    if ($s.Length -gt 50) { $s = $s.Substring(0, 50) }
    if ($s -eq "") { $s = "tache" }
    return $s
}

$demande = Get-LastUserMessage $transcriptPath
$slug    = Get-Slug $demande

$docsDir = "C:\Users\alhou\Documents\epf-marketplace-docs"
if (-not (Test-Path $docsDir)) { New-Item -ItemType Directory -Force -Path $docsDir | Out-Null }

# -- Numero d'ordre incremental (01, 02, ...) --
$maxNum = 0
$existingDocs = Get-ChildItem $docsDir -Filter "*.md" -ErrorAction SilentlyContinue |
                Where-Object { $_.Name -match "^\d{2}-" }
if ($existingDocs) {
    $maxNum = ($existingDocs | ForEach-Object {
        if ($_.Name -match "^(\d+)-") { [int]$Matches[1] } else { 0 }
    } | Measure-Object -Maximum).Maximum
}
$nextNum = ($maxNum + 1).ToString("00")

$docFile = Join-Path $docsDir "$nextNum-$slug.md"

# -- Emojis construits depuis leur code Unicode (source du script en ASCII pur,
#    pour que l'encodage ANSI de PowerShell 5.1 ne casse rien) --
$E_PAGE  = [char]::ConvertFromUtf32(0x1F4C4)  # page
$E_DATE  = [char]::ConvertFromUtf32(0x1F4C5)  # calendrier
$E_ASK   = [char]::ConvertFromUtf32(0x1F64B)  # main levee
$E_WORK  = [char]::ConvertFromUtf32(0x1F528)  # marteau
$E_CHECK = [char]::ConvertFromUtf32(0x2705)   # coche verte
$E_PARTY = [char]::ConvertFromUtf32(0x1F389)  # cotillon
$E_BOT   = [char]::ConvertFromUtf32(0x1F916)  # robot

# -- Chemins relatifs au projet, avec une petite explication simple --
$prefix = $projectDir.TrimEnd('\') + '\'
$filesList = ($touched | ForEach-Object {
    $rel = $_
    if ($rel.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        $rel = $rel.Substring($prefix.Length)
    }
    $nom = Split-Path $rel -Leaf
    "- $E_PAGE ``$nom`` (c'est range ici : ``$rel``)"
}) -join "`r`n"

$nbFichiers = $touched.Count
$motFeuille = if ($nbFichiers -gt 1) { "feuilles" } else { "feuille" }
$motMorceau = if ($nbFichiers -gt 1) { "morceaux" } else { "morceau" }
$titre      = if ($demande) { $demande } else { "Une petite tache" }
$demandeTxt = if ($demande) { $demande } else { "(on ne sait plus exactement)" }
$date       = Get-Date -Format "dd/MM/yyyy a HH:mm"

$contenu  = "# $nextNum - $titre`r`n`r`n"
$contenu += "$E_DATE **Quand ?** Le $date`r`n`r`n"
$contenu += "---`r`n`r`n"
$contenu += "## $E_ASK Ce qu'on a demande`r`n`r`n"
$contenu += "Voici ce que la personne a demande, avec ses mots :`r`n`r`n"
$contenu += "> $demandeTxt`r`n`r`n"
$contenu += "## $E_WORK Ce qu'on a fait`r`n`r`n"
$contenu += "On a touche a **$nbFichiers $motFeuille** du projet.`r`n"
$contenu += "Imagine le projet comme un gros cahier : chaque fichier est une page,`r`n"
$contenu += "et on a ecrit ou corrige des choses sur ces pages-la :`r`n`r`n"
$contenu += "$filesList`r`n`r`n"
$contenu += "## $E_CHECK En une phrase`r`n`r`n"
$contenu += "On a change $nbFichiers $motMorceau du projet pour faire ce qui etait demande. Voila, c'est tout ! $E_PARTY`r`n`r`n"
$contenu += "---`r`n"
$contenu += "*Cette fiche s'ecrit toute seule a la fin de chaque tache. $E_BOT*`r`n"

Set-Content -Path $docFile -Value $contenu -Encoding UTF8
Remove-Item $bufferFile -Force -ErrorAction SilentlyContinue

Write-Host "[doc-hook] Fiche creee : $docFile"
exit 0
