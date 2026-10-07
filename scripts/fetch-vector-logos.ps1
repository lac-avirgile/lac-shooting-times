# One-time asset preparation. No network requests are needed by the running app.
$ErrorActionPreference = 'Stop'
$logoDestination = Join-Path $PSScriptRoot '../public/assets/logos'
New-Item -ItemType Directory -Path $logoDestination -Force | Out-Null
$teamIds = @{
    hawks=1610612737; celtics=1610612738; cavaliers=1610612739; pelicans=1610612740; bulls=1610612741
    mavericks=1610612742; nuggets=1610612743; warriors=1610612744; rockets=1610612745; lakers=1610612747
    heat=1610612748; bucks=1610612749; timberwolves=1610612750; nets=1610612751; knicks=1610612752
    magic=1610612753; pacers=1610612754; '76ers'=1610612755; suns=1610612756; trailblazers=1610612757
    kings=1610612758; spurs=1610612759; thunder=1610612760; raptors=1610612761; jazz=1610612762
    grizzlies=1610612763; wizards=1610612764; pistons=1610612765; hornets=1610612766
}
foreach ($entry in $teamIds.GetEnumerator()) {
    $logoUrl = "https://cdn.nba.com/logos/nba/$($entry.Value)/global/L/logo.svg"
    if (Test-Path -LiteralPath (Join-Path $logoDestination "$($entry.Key).svg")) { continue }
    Invoke-WebRequest -Uri $logoUrl -OutFile (Join-Path $logoDestination "$($entry.Key).svg") -UseBasicParsing
    Write-Output "$($entry.Key): official NBA vector logo saved"
}
