const _ = require('lodash')
const EventEmitter = require('EventEmitter2')
const ScoreKeeper = require('./score-keeper')
const viewBoardText = require('./view-board-text')
const debug = require('debug')('game')

class Game extends EventEmitter {

  constructor(options) {
    super()
    this.options = options
    this.on('next-turn', this._nextTurn.bind(this))
    this.gameNumber = -1
  }

  reset(options) {
    if (!options) options = this.options
    let board = this.board = []
    let m = this.m = options.m || options.rank || 3
    let n = this.n = options.n || options.rank || 3
    this.k = options.k || options.rank || 3
    this.players = options.players
    this.turn = 0
    this.history = []
    for (let i = 0; i<m; i++) {
      board.push(new Array(n).fill(0))
    }
  }

  displayBoard() {
    var boardText = viewBoardText(this.board)
    boardText.forEach((row)=>console.log(row))
  }

  play(done) {
    this.gameNumber++
    if (done) this.once('finish', ({winner}={}) => {
      const { players, history, m, n, k } = this
      const result = { winner, history, m, n, k }
      for (let i in players) {
        const player = players[i]
        if (player.learnGame) player.learnGame(result,i+1)
      }
      done(result)
    })
    // this.displayBoard()
    this._nextTurn()
  }

  async _nextTurn() {
    const { m, n, turn, history } = this
    if (turn === m * n) return this._tie()
    const board = this.board.map((x)=>x.slice())
    const players = this.players.length
    const num = (this.turn % players) + 1
    const player = this.players[num-1]
    const input  = { num, players, board, m, n, turn, history }
    const done = this._playerDone.bind(this,num)
    const progress = this._progress.bind(this,num)
    this.turn++
    await player.play(input,done,progress)
  }

  _progress(player, message) {
    console.log('progress', player, message)
  }

  _playerDone(player, result) {
    debug('player done',player,result)
    this._place(player, result.x, result.y)
  }

  _place(player, x, y) {
    const { board, history, k } = this
    if (board[x][y] !== 0) {
      console.error('invalid move', player, x, y)
      this.emit('next-turn')
      return
    }

    board[x][y] = player
    history.push({player,x,y})
    // this.displayBoard()
    let won = ScoreKeeper.isWin(k,board,x,y,player)
    // this.displayBoard()
    if (won) return this._won(player)
    this.emit('next-turn')
    return true
  }

  _won(player) {
    // console.log(`player ${player} won!`)
    this.emit('finish', {winner:player})
  }

  _tie() {
    // console.log('tie!')
    this.emit('finish')
  }
}

module.exports = Game
