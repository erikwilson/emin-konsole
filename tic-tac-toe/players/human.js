module.exports = (input, done, progress) => {
  var readline = require('readline')

  var rl = readline.createInterface(process.stdin, process.stdout)
  rl.setPrompt('move> ')
  rl.prompt()
  rl.on('line', function(line) {
    var pos = line.split(/[, ]+/)
    var result = {x:pos[0]/1, y:pos[1]/1}
    if (!input.board[result.x] || input.board[result.x][result.y]!==0) {
      console.log('invalid move')
      rl.prompt()
      return
    }
    rl.close()
    done(result)
  })
}
