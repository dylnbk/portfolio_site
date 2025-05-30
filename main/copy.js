const shell = require('shelljs')

// copy netlify functions and admin folder after build completes
shell.cp('-R', 'netlify', 'dist/')
shell.cp('-R', 'admin', 'dist/')