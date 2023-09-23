const shell = require('shelljs')

// copy netlify functions after build completes
shell.cp('-R', 'netlify', 'dist/')