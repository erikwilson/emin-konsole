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
    var board = this.board = []
    var rank  = this.rank = options.rank || 3
    this.players = options.players
    this.turn = 0
    this.history = []

    for (let y = 0; y<rank; y++) {
    	board[y] = new Array(rank).fill(0)
    }
    this.scoreKeeper = new ScoreKeeper(this.board, this.rank)
  }

  displayBoard() {
    var boardText = viewBoardText(this.board,this.rank)
    boardText.forEach((row)=>console.log(row))
  }

  play(done) {
    this.gameNumber++
    if (done) this.once('finish', ({winner}={}) => {
      const { players, rank, history } = this
      done({ players: players.length, winner, rank, history })
    })
    // this.displayBoard()
    this._nextTurn()
  }

  async _nextTurn() {
    if (this.turn === this.rank**2) return this._tie()
    const num = ((this.gameNumber + this.turn) % this.players.length) + 1
    // console.log({num})
    const player = this.players[num-1]
    const input  = {
      num,
      players: this.players.length,
      rank: this.rank,
      board: this.board,
      turn: this.turn,
      history: this.history,
    }
    const done = this._playerDone.bind(this,num)
    const progress = this._progress.bind(this,num)
    this.turn++
    // console.log({player},num)
    await player.play(input,done,progress)
    // process.nextTick(()=>)
  }

  _progress(player, message) {
    console.log('progress', player, message)
  }

  _playerDone(player, result) {
    debug('player done',player,result)
    this._place(player, result.x, result.y)
  }

  _place(player, x, y) {
    if (this.board[y][x] !== 0) {
      console.error('invalid move', player, x, y)
      this.emit('next-turn')
      return
    }

    this.board[y][x] = player
    this.history.push({player,x,y})

    let won = false
    const scores = this.scoreKeeper.pscore(x,y,player)
    const score = Math.max.apply(null,scores)
    if (score === this.rank) won = true

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
