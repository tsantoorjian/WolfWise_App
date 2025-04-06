/**
 * Netlify build plugin to bypass Python detection
 */

module.exports = {
  onPreBuild: ({ utils }) => {
    console.log('🛑 Python Bypass Plugin: Preventing Python detection');
    
    // Set environment variables to skip Python
    process.env.NETLIFY_USE_PYTHON = 'false';
    process.env.SKIP_PYTHON_SETUP = 'true';
    
    // Create empty files to prevent Python detection
    utils.build.failPlugin('Skipping Python setup');
  },
  
  onSuccess: () => {
    console.log('✅ Python Bypass Plugin: Build completed successfully');
  }
} 