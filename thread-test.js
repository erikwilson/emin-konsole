const Pool  = require('threads').Pool
const spawn = require('threads').spawn
const fibo  = require('./fibo')

const start = Date.now()
const thread = spawn(fibo)
thread.on('error', function(error) {
  console.error('Worker errored:', error);
})
thread.on('exit', function() {
  console.log('Worker has been terminated.');
})

var count = 0

thread.on('message', function(msg) {
  console.log(`fib(${msg.input}) = ${msg.result}`)
  const finish = Date.now()
  console.log('done in', `${finish-start}ms`)
  count++
  if (count==8) thread.kill()
})

thread.on('progress', function(msg) {
  console.log(`fib(${msg.input}) = ${msg.result}`)
})

thread.send(40)
thread.send(39)
thread.send(38)
thread.send(37)
thread.send(36)
thread.send(35)
thread.send(34)
thread.send(33)

// var numWorkers = 2
// console.log({numWorkers})
//
// const pool = new Pool(numWorkers)
//
// pool.on('error', (job, error) => {
//   console.error('Job errored:', error)
// })
//
// pool.on('done', (job, msg) => {
//   // console.log(job)
//   console.log(`fib(${msg.input}) = ${msg.result}`)
// })
//
// pool.once('finished', () => {
//   const finish = Date.now()
//   console.log('done in', `${finish-start}ms`)
//   pool.killAll()
// })
//
// pool.run(fibo)
//
// pool.send(40)
// pool.send(39)
// pool.send(38)
// pool.send(37)
