const spawn = require('threads').spawn

module.exports = (worker) => {
  const thread = spawn(worker)

  return (input, done, progress) => {
    thread.removeListener('message')
    thread.removeListener('progress')
    thread.on('message', done)
    thread.on('progress', progress)
    thread.send(input)
  }
}
