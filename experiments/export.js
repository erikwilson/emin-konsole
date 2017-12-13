#!/usr/bin/env node --max-old-space-size=4096
const Brute = require('../mnk/players/brute')
const brute = new Brute({m:4,n:4,k:4})
console.log(JSON.stringify(brute.turnList,null,2))
