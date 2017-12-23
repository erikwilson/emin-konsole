const ScoreKeeper = require('../score-keeper')

class BruterPlayer {
  constructor({ m, n, k }) {
    this.setup({ m, n, k })
    Object.keys(this).forEach((key)=> {
      Object.defineProperty(this, key, {enumerable:false})
    })
  }

  setup({ m, n, k }) {
    const startTime = Date.now()
    this.turns = new Array((m*n)+1).fill().map(()=>new Object())
    this.turnList = []
    this.m = m
    this.n = n
    this.k = k
    this.count = 0
    const board = new Array(m).fill(0).map(()=>new Array(n).fill(0))
    this.computeTurns(board)
    console.error(`bruter created ${this.turnList.length} turns in ${Date.now()-startTime} ms`)
  }

  computeTurns( board, turn=0, pos ) {
    // if (turn<4) console.error('start',turn,pos)
    this.count++
    // if (this.count % 100000 === 0) console.error('...',this.count)

    const { m, n, k } = this
    const previous = ((turn-1) % 2) + 1
    const next = (turn % 2) + 1

    const [ x, y ] = pos || []
    if (pos !== undefined) {
      board = board.map((r,i) => x===i ? r.slice() : r )
      board[x][y] = previous
    }
    let key = this.getBoardKey(board)
    if (this.turns[turn][key]) {
      // if (turn<4) console.error('cached',turn,pos)
      return this.turns[turn][key]
    }

    const result = { wins:0, ties:0, dies:0, key, turn }

    if (pos !== undefined && Math.ceil(turn/2) >= k ) {
      const won = ScoreKeeper.isWin(k,board,x,y,previous)
      if (won) {
        result.wins = 1
        result.winner = previous
      } else if (turn === m*n) {
        result.ties = 1
      } else {
        result.next = next
      }
    }

    if (!result.wins && !result.ties) {
      const openMoves = []
      for (let x=0; x<m; x++) {
        for (let y=0; y<n; y++) {
          if (board[x][y] === 0) openMoves.push([x,y])
        }
      }

      let anyWins = 0
      let anyTies = 0
      let anyDies = 0

      result.moves = openMoves.map((pos)=> {
        const result = { wins:0, ties:0, dies:0, pos }
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
    }

    this.turnList.push(result)
    // if (this.turnList.length % 10000 === 0)
    //   console.error(this.turnList.length )

    for (let i=0; i<4; i++) {
      this.turns[turn][this.getBoardKey(board)] = result
      this.turns[turn][this.getBoardKey(this.invertArray(board))] = result
      board = this.rotateArrayRight(board)
    }
    // if (turn<4) console.error('done',turn,pos)

    return result
  }

  play(input, done) {
    const { board } = input
    const boardKey = this.getBoardKey(board)
    const turn = this.turns[input.turn][boardKey]
    if (!turn) console.error('boardKey',boardKey)
    const wins = []
    const ties = []

    const boards = [boardKey]
    const rotations = [board]
    for (let i=1; i<4; i++) {
      rotations[i] = this.rotateArrayRight(rotations[i-1])
      boards[i] = this.getBoardKey(rotations[i])
    }
    for (let i=4; i<8; i++) {
      boards[i] = this.getBoardKey(this.invertArray(rotations[i-4]))
    }

    const selectRandom = (moves) => {
      return moves[this.getRandomInt(0,moves.length)]
    }

    turn.moves.forEach((move)=>{
      if (move.wins) wins.push(move.pos)
      if (move.ties) ties.push(move.pos)
    })

    let x, y
    if (wins.length) [x,y] = selectRandom(wins)
    else if (ties.length) [x,y] = selectRandom(ties)
    else throw new Error('no win or tie options?')

    let m, n
    let boardIndex = boards.indexOf(turn.key)
    if (boardIndex >= 4) {
      {let t = x; x = y; y = t}
      // [x, y] = [y, x]
      boardIndex -= 4
      m = rotations[boardIndex][0].length
      n = rotations[boardIndex].length
    } else {
      m = rotations[boardIndex].length
      n = rotations[boardIndex][0].length
    }
    if (boardIndex>0){
      for (let i=0; i<(4-boardIndex); i++) {
        {let t = x; x = y; y = (m - t - 1)}
        // [x, y] = [y, m-x-1]
        {let t = m; m = n; n = t}
        // [m, n] = [n, m]
      }
    }

    return done({x,y})
  }

  getRandomInt(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min
  }

  getBoardKey(board) {
    // return board.map((x)=>x.join('')).join(':')
    const d = board.length - board[0].length
    const j = ( d> 0 ? new Array(d).fill(0).join('') : '')
    const s = board.map((x)=>x.join('')).join(j)
    const r = Number.parseInt(s,3)
    return r
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

module.exports = BruterPlayer
