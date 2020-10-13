#!/usr/bin/env node

const b = require('browserify')()
const fs = require('fs')
const path = require('path')
const BruterPlayer = require('../mnk/players/bruter')

const {argv} = require('yargs')
  .option('bundle', {
    type: 'boolean',
    description: 'Create bundle-data file',
  })
  .option('bundle-file', {
    type: 'string',
    default: path.join('browser', 'bundle-data.js'),
    description: 'Location to create bundle-data file',
  })
  .option('gen', {
    alias: 'g',
    type: 'array',
    default: [
        [ 3, 3, 3 ],
        [ 4, 3, 3 ],
        [ 4, 4, 3 ],
      ].map((size) => { return size.join(',') }),
    description: 'Sizes to generate',
  })
  .option('force', {
    alias: 'f',
    type: 'boolean',
    description: 'Remove generated content before starting',
  })

if (argv.force) {
  fs.rmdirSync(path.join('mnk', 'players', 'generated'), {recursive:true})
}

argv.gen.map((sizeStr) => {
  let [m,n,k] = sizeStr.split(',')
  return { m, n, k }
}).map((size) => {
  let bruter = new BruterPlayer(size)
  bruter.writeStates()
  b.require(`./mnk/players/${bruter.generated}`, {expose: `./${bruter.generated}`})
})

if (argv.bundle) {
  console.log(`creating bundle at ${argv.bundleFile}`)
  b.bundle()
    .on('error',console.error)
    .pipe(fs.createWriteStream(argv.bundleFile))
}
