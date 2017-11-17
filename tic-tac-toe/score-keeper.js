const _ = require('lodash')
const debug = require('debug')('score-keeper')

class ScoreKeeper {

  constructor(board, rank) {
    this.board = board
    this.rank  = rank
  }

  score(x,y) {
    return this.combineScores([
      this.scoreX(x),
      this.scoreY(y),
      this.scoreD1(x,y),
      this.scoreD2(x,y),
    ])
  }

  combineScores(scores) {
    var result = {}
    _.forEach(scores, (score) => {
      _.forEach(score, (value, key) => {
        if (!result[key] || value > result[key]) result[key] = value
      })
    })
    return result
  }

  scoreX(x) {
    var score = {}
    for (let j=0; j<this.rank; j++) {
      const player = this.board[x][j]
      if (player !== 0) score[player] = score[player] ? score[player]+1 : 1
    }
    debug('scoreX',score)
    return score
  }

  scoreY(y) {
    var score = {}
    for (let i=0; i<this.rank; i++) {
      const player = this.board[i][y]
      if (player !== 0) score[player] = score[player] ? score[player]+1 : 1
    }
    debug('scoreY',score)
    return score
  }

  scoreD1(x, y) {
    var score = {}
    if ((x - y) !== 0) {
      return score
    }
    for (let i=0, j=0; i<this.rank; i++, j++) {
      const player = this.board[i][j]
      if (player !== 0) score[player] = score[player] ? score[player]+1 : 1
    }
    debug('scoreD1',score)
    return score
  }

  scoreD2(x, y) {
    var score = {}
    if ((x + y) !== (this.rank - 1)) {
      return score
    }
    for (let i=0, j=this.rank-1; i<this.rank; i++, j--) {
      const player = this.board[i][j]
      if (player !== 0) score[player] = score[player] ? score[player]+1 : 1
    }
    debug('scoreD2',score)
    return score
  }
}

module.exports = ScoreKeeper
