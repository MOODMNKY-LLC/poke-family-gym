const fs = require('fs')
const { exec } = require('child_process')
const path = require('path')

// Ensure ffmpeg is installed
exec('ffmpeg -version', (error) => {
  if (error) {
    console.error('FFmpeg is required to generate sound effects. Please install it first.')
    process.exit(1)
  }

  // Create sounds directory if it doesn't exist
  const soundsDir = path.join(__dirname, '..', 'public', 'sounds')
  if (!fs.existsSync(soundsDir)) {
    fs.mkdirSync(soundsDir, { recursive: true })
  }

  // Generate sound effects using FFmpeg
  const sounds = {
    hover: '-f lavfi -i "sine=frequency=880:duration=0.1" -af "fade=t=in:st=0:d=0.01,fade=t=out:st=0.09:d=0.01"',
    purchase: '-f lavfi -i "sine=frequency=440:duration=0.3" -af "fade=t=in:st=0:d=0.05,fade=t=out:st=0.25:d=0.05"',
    open: '-f lavfi -i "sine=frequency=1760:duration=0.2" -af "fade=t=in:st=0:d=0.02,fade=t=out:st=0.18:d=0.02"',
    rare: '-f lavfi -i "sine=frequency=1760:duration=0.5" -filter_complex "aecho=0.8:0.5:40:0.5" -af "fade=t=in:st=0:d=0.05,fade=t=out:st=0.45:d=0.05"'
  }

  Object.entries(sounds).forEach(([name, options]) => {
    const outputFile = path.join(soundsDir, `${name}.wav`)
    const command = `ffmpeg -y ${options} "${outputFile}"`
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error generating ${name} sound:`, error)
        return
      }
      console.log(`Generated ${name} sound effect`)
    })
  })
}) 