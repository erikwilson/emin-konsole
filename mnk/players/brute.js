const ScoreKeeper = require('../score-keeper')

class BrutePlayer {
  constructor({ m, n, k }) {
    this.setup({ m, n, k })
    Object.keys(this).forEach((key)=> {
      Object.defineProperty(this, key, {enumerable:false})
    })
  }

  setup({ m, n, k }) {
    const startTime = Date.now()
    this.turns = {}
    this.turnList = []
    this.m = m
    this.n = n
    this.k = k
    const board = new Array(m).fill(0).map(()=>new Array(n).fill(0))
    this.computeTurns(board)
    // console.log(`created ${this.turnList.length} turns in ${Date.now()-startTime} ms`)
  }

  computeTurns( board, turn=0, pos ) {
    const { m, n, k } = this
    const previousPlayer = ((turn-1) % 2) + 1
    const nextPlayer = (turn % 2) + 1

    let { x, y } = pos >= 0 ? this.posToXy(pos,n) : {}
    if (pos !== undefined) {
      board = board.map((r,i) => x===i ? r.slice() : r )
      board[x][y] = previousPlayer
    }
    let boardStr = this.getBoardString(board)
    if (this.turns[boardStr]) return this.turns[boardStr]

    const boards = [ boardStr ]
    const result = { wins:0, ties:0, dies:0, boards, turn, nextPlayer }
    if (pos !== undefined && Math.ceil(turn/2) >= k ) {
      const won = ScoreKeeper.isWin(k,board,x,y,previousPlayer)
      if (won) {
        result.wins = 1
        result.winner = previousPlayer
        delete result.nextPlayer
      } else if (turn === m*n) {
        result.ties = 1
        delete result.nextPlayer
      }
    }

    const openMoves = []
    if (!result.wins && !result.ties) {
      for (let i=0; i<m; i++) {
        for (let j=0; j<n; j++) {
          if (board[i][j] === 0) openMoves.push(this.xyToPos(i,j,n))
        }
      }
    }

    let anyWins = 0
    let anyTies = 0
    let anyDies = 0

    const moves = result.moves = openMoves.map((pos)=> {
      const result = { wins:0, ties:0, dies:0, pos:[pos] }
      const next = this.computeTurns(board,turn+1,pos)
      anyWins |= next.wins
      anyTies |= next.ties
      anyDies |= next.dies
      result.wins = next.wins
      result.ties = next.ties
      result.dies = next.dies
      return result
    })

    if (anyWins) result.dies = 1
    else if (anyTies) result.ties = 1
    else if (anyDies) result.wins = 1

    {
      const rotations = [board]
      for (let i=1; i<4; i++) {
        const board = this.rotateArrayRight(rotations[i-1])
        const boardStr = this.getBoardString(board)
        if (boards.includes(boardStr)) break
        const m = board.length
        const n = board[0].length
        moves.forEach(({pos}) => pos.push(this.rotateIndexRight(pos[i-1],n,m)))
        boards.push(boardStr)
        rotations.push(board)
      }

      for (let i in rotations) {
        const board = this.invertArray(rotations[i])
        const boardStr = this.getBoardString(board)
        if (boards.includes(boardStr)) break
        const m = board.length
        const n = board[0].length
        moves.forEach(({pos}) => pos.push(this.invertPosition(pos[i],n,m)))
        boards.push(boardStr)
      }
    }

    this.turnList.push(result)
    boards.forEach((b) => this.turns[b] = result)
    return result
  }

  play(input, done) {
    const { num, board, m, n } = input
    const boardStr = this.getBoardString(board)
    const turn = this.turns[boardStr]
    const boardIndex = turn.boards.indexOf(boardStr)
    const wins = []
    const ties = []

    const selectRandom = (moves) => {
      const pos = moves[this.getRandomInt(0,moves.length)]
      return this.posToXy(pos,n)
    }

    turn.moves.forEach((move)=>{
      if (move.wins) wins.push(move.pos[boardIndex])
      if (move.ties) ties.push(move.pos[boardIndex])
    })

    if (wins.length) return done(selectRandom(wins))
    if (ties.length) return done(selectRandom(ties))

    throw new Error('no win or tie options?')
  }

  getRandomInt(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min
  }

  getBoardString(board) {
    return board.map((x)=>x.join('')).join(':')
  }

  invertPosition(i, m, n) {
    const xy = this.posToXy(i,n)
    return this.xyToPos(xy.y,xy.x,m)
  }

  invertArray(array) {
    const m = array.length
    const n = array[0].length
    let newArray = new Array(n)
    for (let j=0; j<n; j++) {
      newArray[j] = new Array(m)
      for (let i=0; i<m; i++) {
        newArray[j][i] = array[i][j]
      }
    }
    return newArray
  }

  posToXy(i,n) {
    const x = Math.floor(i/n)
    const y = i-(x*n)
    return {x,y}
  }

  xyToPos(x,y,n) {
    return (x*n)+y
  }

  rotateIndexRight(i,m,n) {
    const y = Math.floor(i/n)
    const x = i-(y*n)
    const r = (x*m)+(m-y-1)
    return r
  }

  rotateArrayRight(array) {
    const m = array.length
    const n = array[0].length
    let newArray = new Array(n)
    for(let j=0; j<n; j++) {
      newArray[j] = new Array(m)
      for(let i=0; i<m; i++) {
        newArray[j][m-i-1]=array[i][j]
      }
    }
    return newArray
  }

}

module.exports = BrutePlayer
