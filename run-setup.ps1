[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

$script = Get-Content -Path "$PSScriptRoot\setup-and-test.ps1" -Raw -Encoding UTF8
$tmpFile = [System.IO.Path]::Combine($env:TEMP, "setup-and-test-$([guid]::NewGuid()).ps1")
[System.IO.File]::WriteAllText($tmpFile, $script, [System.Text.Encoding]::UTF8)

try {
    & $tmpFile
} finally {
    Remove-Item $tmpFile -Force -ErrorAction SilentlyContinue
}
