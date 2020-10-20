#!/usr/bin/env node --experimental-json-modules

import fs from 'fs'
import path from 'path'
import Browserify from 'browserify'
import Yargs from 'yargs'

import BruterPlayer from '../mnk/players/bruter.js'
const b = Browserify()

const {argv} = Yargs()
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
  b.require(`./mnk/players/${bruter.generated}`, {expose: `./${bruter.generated}`})
  bruter.writeStates()
})

if (argv.bundle) {
  console.log(`creating bundle at ${argv.bundleFile}`)
  b.bundle()
    .on('error',console.error)
    .pipe(fs.createWriteStream(argv.bundleFile))
}
