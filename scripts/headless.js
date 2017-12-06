#!/usr/bin/env node

const mnk = require('../mnk')
const repl = require('repl')

console.log('Welcome to eMiN Konsole:')
repl.start('> ').context.mnk = mnk
