const Pool  = require('threads').Pool
const spawn = require('threads').spawn
const fibo  = require('./fibo')

var numWorkers = 32
console.log(numWorkers)

const start = Date.now()
const pool = new Pool(numWorkers)

pool.on('error', (job, error) => {
  console.error('Job errored:', error)
})

pool.on('done', (job, msg) => {
  console.log(`fib(${msg.input}) = ${msg.result}`)
})

pool.once('finished', () => {
  const finish = Date.now()
  console.log('done in', `${finish-start}ms`)
  pool.killAll()
})

pool.run(fibo)

for (var i=0; i<32; i++) {
  pool.send(38)
}
