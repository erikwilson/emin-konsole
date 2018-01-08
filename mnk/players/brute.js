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
    this.states = new Array((m*n)+1).fill().map(()=>new Object())
    this.stateList = []
    this.m = m
    this.n = n
    this.k = k
    const board = new Array(m).fill(0).map(()=>new Array(n).fill(0))
    this.computeTurns(board)
    console.error(`bruter created ${this.stateList.length} turns in ${Date.now()-startTime} ms`)
  }

  computeTurns( board, turn=0, pos ) {
    const { m, n, k } = this
    const previous = ((turn-1) % 2) + 1

    const [ x, y ] = pos || []
    if (pos !== undefined) {
      board = board.map((r,i) => x===i ? r.slice() : r )
      board[x][y] = previous
    }
    let key = this.getBoardKey(board)
    if (this.states[turn][key]) return this.states[turn][key]

    const result = { s:2, k:key }
    this.stateList.push(result)
    for (let i=0; i<4; i++) {
      if (board.length === m) {
        this.states[turn][this.getBoardKey(board)] = result
      }
      if (board.length === n) {
        this.states[turn][this.getBoardKey(this.invertArray(board))] = result
      }
      board = this.rotateArrayRight(board)
    }

    let done = false
    if (pos !== undefined && Math.ceil(turn/2) >= k ) {
      const won = ScoreKeeper.isWin(k,board,x,y,previous)
      if (won) {
        done = true
      } else if (turn === m*n) {
        result.s = 1
        done = true
      }
    }
    if (done) return result

    const openMoves = []
    for (let x=0; x<m; x++) {
      for (let y=0; y<n; y++) {
        if (board[x][y] === 0) openMoves.push([x,y])
      }
    }

    result.m = openMoves.map((pos)=> {
      const next = this.computeTurns(board, turn+1, pos)
      const thisScore = 2-next.s
      if (thisScore<result.s) result.s = thisScore
      return { s:next.s, p:pos }
    })

    return result
  }

  play(input, done) {
    const { board, turn } = input
    const key = this.getBoardKey(board)
    const state = this.states[turn][key]
    if (!state) console.error('key',key)

    const boards = [key]
    const rotations = [board]
    for (let i=1; i<4; i++) {
      rotations[i] = this.rotateArrayRight(rotations[i-1])
      if (rotations[i].length === board.length) {
        boards.push(this.getBoardKey(rotations[i]))
      } else {
        boards.push(-1)
      }
    }
    for (let i=4; i<8; i++) {
      if (rotations[i-4][0].length === board.length) {
        boards.push(this.getBoardKey(this.invertArray(rotations[i-4])))
      } else {
        boards.push(-1)
      }
    }

    const selectRandom = (selection) => {
      if (!selection.length) throw new Error('no selections?')
      return selection[this.getRandomInt(0,selection.length)]
    }

    const maxScore = Math.max.apply(null,state.m.map(m=>m.s))

    let [x, y] = selectRandom(state.m.reduce((r,move)=>{
      if (move.s>=maxScore) r.push(move.p)
      return r
    },[]))

    let [m, n] = []
    let boardIndex = boards.indexOf(state.k)
    if (boardIndex >= 4) {
      [x, y] = [y, x]
      boardIndex -= 4
      m = rotations[boardIndex][0].length
      n = rotations[boardIndex].length
    } else {
      m = rotations[boardIndex].length
      n = rotations[boardIndex][0].length
    }
    if (boardIndex>0){
      for (let i=0; i<(4-boardIndex); i++) {
        [x, y] = [y, m-x-1]; [m, n] = [n, m]
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
    // const d = board.length - board[0].length
    // const j = ( d> 0 ? new Array(d).fill(0).join('') : '')
    const s = board.map((x)=>x.join('')).join('')
    const r = Number.parseInt(s,3)
    return r
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
