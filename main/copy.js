const shell = require('shelljs')

// copy all necessary folders for full functionality after build completes
shell.cp('-R', 'netlify', 'dist/')
shell.cp('-R', 'admin', 'dist/')
shell.cp('-R', 'content', 'dist/')
shell.cp('-R', 'assets', 'dist/')
shell.cp('-R', 'components', 'dist/')
shell.cp('-R', 'data', 'dist/')
shell.cp('-R', 'ascii-background', 'dist/')
shell.cp('-R', 'speech', 'dist/')
shell.cp('-R', 'text-effects', 'dist/')
shell.cp('-R', 'contact', 'dist/')

console.log('Successfully copied all necessary folders to dist/ for full deployment')