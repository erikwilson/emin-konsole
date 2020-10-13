#!/usr/bin/env nodemon -e js

const mnk = require('../mnk')
console.log('Welcome to eMiN Konsole:')
require('repl').start('> ').context.mnk = mnk
