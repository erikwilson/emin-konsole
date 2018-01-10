#!/usr/bin/env node --expose-gc --max-old-space-size=4096
const Brute = require('../mnk/players/bruter-mongo2')
const m = process.argv[2]/1 || 3
const n = process.argv[3]/1 || 3
const k = process.argv[4]/1 || 3
console.error({m,n,k})
new Brute({m,n,k})
