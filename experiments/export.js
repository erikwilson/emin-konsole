#!/usr/bin/env node --max-old-space-size=4096
const Brute = require('../mnk/players/bruter')
const brute = new Brute({m:3,n:3,k:3})

console.log('[')
const last = brute.stateList.length-1
for (let i in brute.stateList) {
  console.log(JSON.stringify(brute.stateList[i]) + (i<last ? ',' : ''))
}
console.log(']')
