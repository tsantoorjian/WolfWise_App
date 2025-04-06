/**
 * Netlify build plugin to bypass Python detection
 */
const fs = require('fs');
const path = require('path');

module.exports = {
  onPreBuild: ({ utils }) => {
    console.log('🛑 Python Bypass Plugin: Preventing Python detection');
    
    // Set environment variables to skip Python
    process.env.NETLIFY_USE_PYTHON = 'false';
    process.env.SKIP_PYTHON_SETUP = 'true';
    process.env.PYTHON_DISABLE = 'true';
    
    // Remove any Python-related files that might be causing detection
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
        console.log(`Removing ${file}...`);
        fs.unlinkSync(filePath);
      }
    });
    
    // Create an empty .mise.toml to override any Python detection
    const miseConfig = path.join(process.cwd(), '.mise.toml');
    fs.writeFileSync(miseConfig, `[tools]\nnode = "18"\n\n[env]\nPYTHON_DISABLE = "true"\nNETLIFY_USE_PYTHON = "false"\nSKIP_PYTHON_SETUP = "true"`);
    
    console.log('✅ Python detection prevention completed');
  },
  
  onBuild: () => {
    console.log('🔨 Python Bypass Plugin: Building with Node.js only');
  },
  
  onSuccess: () => {
    console.log('✅ Python Bypass Plugin: Build completed successfully');
  }
} 