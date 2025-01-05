# Create sounds directory if it doesn't exist
$soundsDir = "public/sounds"
if (-not (Test-Path $soundsDir)) {
    New-Item -ItemType Directory -Path $soundsDir -Force
}

# Define sound effects
$sounds = @{
    "hover" = "https://play.pokemonshowdown.com/audio/sfx/generic_click.wav"
    "purchase" = "https://play.pokemonshowdown.com/audio/sfx/mega.wav"
    "open" = "https://play.pokemonshowdown.com/audio/sfx/ball_bounce.wav"
    "rare" = "https://play.pokemonshowdown.com/audio/sfx/shiny.wav"
}

# Download sound effects
foreach ($sound in $sounds.GetEnumerator()) {
    $outputFile = Join-Path $soundsDir "$($sound.Key).wav"
    Write-Host "Downloading $($sound.Key) sound effect..."
    Invoke-WebRequest -Uri $sound.Value -OutFile $outputFile
}

Write-Host "Sound effects setup complete!" 