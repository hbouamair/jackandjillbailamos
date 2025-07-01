const { spawn } = require('child_process');

console.log('Starting Next.js development server on port 3000...');

const child = spawn('npx', ['next', 'dev', '-p', '3000'], {
  stdio: 'inherit',
  shell: true
});

child.on('error', (error) => {
  console.error('Failed to start server:', error);
});

child.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
}); 