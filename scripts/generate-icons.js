// scripts/generate-icons.js
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// We'll use sharp if available, otherwise fallback to the user installing it
try {
  console.log('Checking for required packages...');
  require.resolve('sharp');
  console.log('Sharp is installed, proceeding with icon generation');
  generateIcons();
} catch (e) {
  console.log('Sharp package not found. Installing required packages...');
  exec('npm install --no-save sharp', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error installing packages: ${error.message}`);
      console.log('Please install sharp manually with: npm install --save-dev sharp');
      return;
    }
    console.log(stdout);
    console.log('Packages installed successfully. Generating icons...');
    generateIcons();
  });
}

function generateIcons() {
  const sharp = require('sharp');
  const sizes = [16, 32, 48, 64, 96, 128, 192, 256, 384, 512];
  
  const inputSvg = path.resolve(__dirname, '../public/logo.svg');
  const faviconSvg = path.resolve(__dirname, '../public/favicon.svg');
  
  // Generate PNGs from logo.svg for various sizes
  sizes.forEach(size => {
    sharp(inputSvg)
      .resize(size, size)
      .png()
      .toFile(path.resolve(__dirname, `../public/icon-${size}.png`))
      .then(() => console.log(`Generated icon-${size}.png`))
      .catch(err => console.error(`Error generating icon-${size}.png:`, err));
  });
  
  // Generate favicon.ico (16x16, 32x32, 48x48)
  const favSizes = [16, 32, 48];
  Promise.all(
    favSizes.map(size => 
      sharp(faviconSvg)
        .resize(size, size)
        .png()
        .toBuffer()
    )
  ).then(buffers => {
    sharp(buffers[0])
      .toFile(path.resolve(__dirname, '../public/favicon.ico'))
      .then(() => console.log('Generated favicon.ico'))
      .catch(err => console.error('Error generating favicon.ico:', err));
  });
}
