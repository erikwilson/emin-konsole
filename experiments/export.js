#!/usr/bin/env node --expose-gc --max-old-space-size=4096
const Brute = require('../mnk/players/bruter')
const brute = new Brute({m:4,n:4,k:4})

console.log('[')
for (let i in brute.states) {
  console.log(' {')
  const states1Max = brute.states.length-1
  const lastI = (i/1 === states1Max)
  const keys = Object.keys(brute.states[i])
  for (let j in keys) {
    const k = keys[j]
    const states2Max = keys.length-1
    const lastJ = (j/1 === states2Max)
    console.log(`  "${k}":`,JSON.stringify(brute.states[i][k]) + (lastJ ? '' : ','))
  }
  console.log(' }' + (lastI ? '' : ','))
}
console.log(']')
