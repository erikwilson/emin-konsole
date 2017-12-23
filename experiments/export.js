#!/usr/bin/env node --max-old-space-size=4096
const Brute = require('../mnk/players/bruter')
const brute = new Brute({m:4,n:4,k:4})

console.log('[')
for (let i in brute.turnList) {
  console.log(JSON.stringify(brute.turnList[i],null,2))
  if (i < brute.turnList.length-1) console.log(',')
}
console.log(']')
