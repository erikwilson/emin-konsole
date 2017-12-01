const _ = require('lodash')
const debug = require('debug')('score-keeper')

class ScoreKeeper {

  constructor(board, rank) {
    this.board = board
    this.rank  = rank
  }

  pscore(x,y,player) {
    const scores = [
      this.pscoreX(x,y,player),
      this.pscoreY(x,y,player),
      this.pscoreD1(x,y,player),
      this.pscoreD2(x,y,player),
    ]
    return scores
  }

  pscoreX(x,y,player) {
    const { board, rank } = this
    let score = 0
    if (board[y][x] === player) score++
    let j = y
    while (--j>=0 && board[j][x] === player) score++
    j = y
    while (++j<rank && board[j][x] === player) score++
    debug('scoreX',score)
    return score
  }

  pscoreY(x,y,player) {
    const { board, rank } = this
    let score = 0
    if (board[y][x] === player) score++
    let i = x
    while (--i>=0 && board[y][i] === player) score++
    i = x
    while (++i<rank && board[y][i] === player) score++
    debug('scoreY',score)
    return score
  }

  pscoreD1(x,y,player) {
    const { board, rank } = this
    let score = 0
    if (board[y][x] === player) score++
    if ((x - y) !== 0) {
      return score
    }
    let i = x
    let j = y
    while (--i>=0 && --j>=0 && board[j][i] === player) score++
    i = x
    j = y
    while (++i<rank && ++j<rank && board[j][i] === player) score++
    debug('scoreX',score)
    return score
  }

  pscoreD2(x,y,player) {
    const { board, rank } = this
    let score = 0
    if (board[y][x] === player) score++
    if ((x + y) !== (rank - 1)) {
      return score
    }
    let i = x
    let j = y
    while (++i<rank && --j>=0 && board[j][i] === player) score++
    i = x
    j = y
    while (--i>=0 && ++j<rank && board[j][i] === player) score++
    debug('scoreX',score)
    return score
  }

  score(x,y) {
    return this.combineScores([
      this.scoreX(x),
      this.scoreY(y),
      this.scoreD1(x,y),
      this.scoreD2(x,y),
    ])
  }
  //
  // combineScores(scores) {
  //   var result = {}
  //   _.forEach(scores, (score) => {
  //     _.forEach(score, (value, key) => {
  //       if (!result[key] || value > result[key]) result[key] = value
  //     })
  //   })
  //   return result
  // }
  //
  // scoreX(x) {
  //   var score = {}
  //   for (let j=0; j<this.rank; j++) {
  //     const player = this.board[x][j]
  //     if (player !== 0) score[player] = score[player] ? score[player]+1 : 1
  //   }
  //   debug('scoreX',score)
  //   return score
  // }
  //
  // scoreY(y) {
  //   var score = {}
  //   for (let i=0; i<this.rank; i++) {
  //     const player = this.board[i][y]
  //     if (player !== 0) score[player] = score[player] ? score[player]+1 : 1
  //   }
  //   debug('scoreY',score)
  //   return score
  // }
  //
  // scoreD1(x, y) {
  //   var score = {}
  //   if ((x - y) !== 0) {
  //     return score
  //   }
  //   for (let i=0, j=0; i<this.rank; i++, j++) {
  //     const player = this.board[i][j]
  //     if (player !== 0) score[player] = score[player] ? score[player]+1 : 1
  //   }
  //   debug('scoreD1',score)
  //   return score
  // }
  //
  // scoreD2(x, y) {
  //   var score = {}
  //   if ((x + y) !== (this.rank - 1)) {
  //     return score
  //   }
  //   for (let i=0, j=this.rank-1; i<this.rank; i++, j--) {
  //     const player = this.board[i][j]
  //     if (player !== 0) score[player] = score[player] ? score[player]+1 : 1
  //   }
  //   debug('scoreD2',score)
  //   return score
  // }
}

module.exports = ScoreKeeper
