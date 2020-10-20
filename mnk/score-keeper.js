import Debug from 'debug'
const debug = Debug('score-keeper')

export default class ScoreKeeper {
  static isWin( k, board, x, y, player ) {
    const scores = this.score( board, x, y, player )
    const maxScore = Math.max.apply( null, scores )
    if (maxScore >= k) return true
    return false
  }

  static score( board, x, y, player ) {
    const scores = [
      this.scoreM( board, x, y, player ),
      this.scoreN( board, x, y, player ),
      this.scoreD1( board, x, y, player ),
      this.scoreD2( board, x, y, player ),
    ]
    return scores
  }

  static scoreM( board, x, y, player ) {
    if (board[x][y] !== player) return 0
    const m = board.length
    let score = 1
    for (let i=x; --i>=0 && board[i][y]===player;) score++
    for (let i=x; ++i<m  && board[i][y]===player;) score++
    debug('scoreY',score)
    return score
  }

  static scoreN( board, x, y, player ) {
    if (board[x][y] !== player) return 0
    const n = board[0].length
    let score = 1
    for (let j=y; --j>=0 && board[x][j]===player;) score++
    for (let j=y; ++j<n  && board[x][j]===player;) score++
    debug('scoreX',score)
    return score
  }

  static scoreD1( board, x, y, player ) {
    if (board[x][y] !== player) return 0
    const m = board.length
    const n = board[0].length
    let score = 1
    for (let i=x, j=y; --i>=0 && --j>=0 && board[i][j]===player;) score++
    for (let i=x, j=y; ++i<m  && ++j<n  && board[i][j]===player;) score++
    debug('scoreD1',score)
    return score
  }

  static scoreD2( board, x, y, player ) {
    if (board[x][y] !== player) return 0
    const m = board.length
    const n = board[0].length
    let score = 1
    for (let i=x, j=y; ++i<m  && --j>=0 && board[i][j]===player;) score++
    for (let i=x, j=y; --i>=0 && ++j<n  && board[i][j]===player;) score++
    debug('scoreD2',score)
    return score
  }
}
