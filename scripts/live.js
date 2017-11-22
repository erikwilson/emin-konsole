#!/usr/bin/env node

const spawn = require('cross-spawn')
const fs = require('fs')
const path = require('path')
const browserify = require('browserify')
const livereload = require('browserify-livereload')
const watchify = require('watchify')

const outfile = 'bundle.js'

const b = browserify({
  entries: 'play.js',
  standalone: 'play',
  cache: {},
  packageCache: {},
  debug: true,
  plugin: [watchify],
})

b.plugin(livereload, {
  host: 'localhost',
  port: 1337,
  outfile,
})

b.on('update', bundle)
b.on('error', console.log)
b.on('syntax', console.log)

function bundle() {
  b.bundle().on('error',console.error).pipe(fs.createWriteStream(outfile))
  console.log(`wrote ${outfile}`)
}

bundle()

setTimeout(() => {
  console.log('launching electron')
  const cmd = path.join(__dirname, 'electron.js')
  const child = spawn(cmd, {detached: false, stdio: 'inherit'})
  child.on('close', () => {
    console.log('electron is done')
    process.exit()
  })
},500)
