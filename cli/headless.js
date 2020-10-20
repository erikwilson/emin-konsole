#!/usr/bin/env nodemon -e js

import repl from 'repl'
import MNK from '../mnk/index.js'

const mnk = new MNK(4,4,3)
console.log('Welcome to eMiN Konsole:')
repl.start('> ').context.mnk = mnk
