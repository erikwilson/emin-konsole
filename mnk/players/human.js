const viewBoardText = require('../view-board-text')

class HumanPlayer {
  play(input, done) {
    const { num } = input
    this.board = input.board
    this.done = done
    console.log('\n' + viewBoardText(this.board).join('\n'))
    console.log(`Your turn, human player ${num}:`)
  }

  move(x,y) {
    if (!this.done) return
    if (!this.board[x]) return
    if (this.board[x][y] !== 0) return
    const done = this.done
    this.done = undefined
    return done({x,y})
  }
}

module.exports = HumanPlayer
