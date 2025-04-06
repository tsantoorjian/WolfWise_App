#!/usr/bin/env node

/**
 * Custom Netlify build script to bypass automatic Python detection
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Display configuration
console.log('Starting custom build process');
console.log('NODE_VERSION:', process.version);
console.log('Current directory:', process.cwd());

// Remove any Python-related files at the root level that might trigger detection
const filesToRemove = [
  '.python-version',
  'runtime.txt',
  'requirements.txt',
  'Pipfile',
  'Pipfile.lock'
];

filesToRemove.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`Removing ${file} to prevent Python detection...`);
    fs.unlinkSync(filePath);
  }
});

// Set environment variables to prevent Python use
process.env.NETLIFY_USE_PYTHON = 'false';
process.env.SKIP_PYTHON_SETUP = 'true';
process.env.PYTHON_DISABLE = 'true';

try {
  // Ensure node_modules exists
  if (!fs.existsSync('node_modules')) {
    console.log('Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
  } else {
    console.log('Node modules already installed');
  }

  // Run the build
  console.log('Building project...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Build completed successfully!');

  // Verify the build output directory
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    console.log('Build artifacts generated successfully in:', distPath);
    console.log('Files in dist directory:');
    const files = fs.readdirSync(distPath);
    console.log(files.join('\n'));
  } else {
    console.error('Error: dist directory not found after build');
    process.exit(1);
  }
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
} 