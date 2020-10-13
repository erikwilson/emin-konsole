#!/usr/bin/env node

const b = require('browserify')({
  entries: 'mnk',
  standalone: 'mnk',
})

const fs = require('fs')
const path = require('path')

const {argv} = require('yargs')
  .option('bundle-file', {
    type: 'string',
    default: path.join('browser', 'bundle.js'),
    description: 'Location to create bundle-data file',
  })

b.bundle()
  .on('error',console.error)
  .pipe(fs.createWriteStream(argv.bundleFile))

console.log(`wrote ${argv.bundleFile}`)
