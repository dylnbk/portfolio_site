const shell = require('shelljs')

// copy netlify functions, admin folder, content folder, and assets after build completes
shell.cp('-R', 'netlify', 'dist/')
shell.cp('-R', 'admin', 'dist/')
shell.cp('-R', 'content', 'dist/')
shell.cp('-R', 'assets', 'dist/')

console.log('Successfully copied netlify, admin, content, and assets folders to dist/')