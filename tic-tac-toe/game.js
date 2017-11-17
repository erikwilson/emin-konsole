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
  }

  reset(options) {
    if (!options) options = this.options
    var board = this.board = []
    var rank  = this.rank = options.rank || 3
    this.players = options.players
    this.turn = 0

    for (let i = 0; i<rank; i++) {
    	board[i] = []
    	for (let j = 0; j<rank; j++) {
    		board[i][j] = 0
    	}
    }
    this.scoreKeeper = new ScoreKeeper(this.board, this.rank)
  }

  displayBoard() {
    var boardText = viewBoardText(this.board,this.rank)
    boardText.forEach((row)=>debug(row))
  }

  play(done) {
    if (done) this.once('finish',done)
    this.displayBoard()
    this._nextTurn()
  }

  _nextTurn() {
    if (this.turn === this.rank**2) return this._tie()

    const player = this.players[this.turn % this.players.length]
    const num = player.num
    const input  = { num, rank: this.rank, board: this.board, turn: this.turn }
    const done = this._playerDone.bind(this,num)
    const progress = this._progress.bind(this,num)
    this.turn++
    process.nextTick(()=>player.play(input,done,progress))
  }

  _progress(player, message) {
    console.log('progress', player, message)
  }

  _playerDone(player, result) {
    debug('player done',player,result)
    this._place(player, result.x, result.y)
  }

  _place(player, x, y) {
    if (this.board[x][y] !== 0) {
      console.error('invalid move', player, x, y)
      this.emit('next-turn')
      return
    }

    this.board[x][y] = player
    const score = this.scoreKeeper.score(x,y)

    this.displayBoard()
    if (score[player] === this.rank) return this._won(player)

    this.emit('next-turn')
    return true
  }

  _won(player) {
    console.log(`player ${player} won!`)
    this.emit('finish')
  }

  _tie() {
    console.log('tie!')
    this.emit('finish')
  }
}

module.exports = Game
