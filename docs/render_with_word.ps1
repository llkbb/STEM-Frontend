param([string]$InputFile, [string]$OutputPdf)
$ErrorActionPreference = 'Stop'
$reportInput = (Resolve-Path -LiteralPath $InputFile).Path
$reportOutput = [System.IO.Path]::GetFullPath($OutputPdf)
$reportWord = $null
$reportDocument = $null
try {
    $reportWord = New-Object -ComObject Word.Application
    $reportWord.Visible = $false
    $reportWord.DisplayAlerts = 0
    $reportDocument = $reportWord.Documents.Open($reportInput, $false, $true)
    $reportDocument.Repaginate()
    $reportDocument.ExportAsFixedFormat($reportOutput, 17)
    Write-Output ('Pages: ' + $reportDocument.ComputeStatistics(2))
    Write-Output $reportOutput
} finally {
    if ($null -ne $reportDocument) { $reportDocument.Close(0) }
    if ($null -ne $reportWord) { $reportWord.Quit() }
}
