const viewBoardText = require('../view-board-text')

class HumanPlayer {
  play(input, done) {
    const { num } = input
    this.board = input.board
    this.rank = input.rank
    this.done = done
    console.log('\n' + viewBoardText(this.board,this.rank).join('\n'))
    console.log(`Your turn, human player ${num}:`)
  }

  move(x,y) {
    if (!this.done) return
    if (!this.board[y]) return
    if (this.board[y][x] !== 0) return
    const done = this.done
    this.done = undefined
    return done({x,y})
  }
}

module.exports = HumanPlayer
