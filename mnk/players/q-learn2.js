class QLearnPlayer {
  constructor({m,n}) {
    this.learningRate = 0.01
    this.epsilon = 0.2
    this.Qinit = 0.5
    this.Qmin = 0.01
    this.Qmax = 1
    this.rWin = 1
    this.rTie = 0.5
    this.rDie = -1
    this.count = 0
    this.discount = 0.2
    this.states = new Array((m*n)+1).fill().map(()=>new Object())
    Object.keys(this).forEach((key)=> {
      Object.defineProperty(this, key, {enumerable:false})
    })
  }

  qLearn(Q, actions, reward) {
    // Q = Q.map((r)=>r.slice())
    let maxQ = 0
    const l = this.learningRate
    const d = this.discount
    const r = reward
    for (let t=Q.length-1; t>=0; t--) {
      const a = actions[t]
      const q = Q[t][a]
      let v = (1-l)*q + l*(r+d*maxQ)
      if (v<this.Qmin) v = this.Qmin
      if (v>this.Qmax) v = this.Qmax
      Q[t][a] = v
      maxQ = Math.max.apply(null,Q[t])
    }
    // return Q
  }

  learnGame({ winner, history, m, n }, p) {
    this.count++
    const board = new Array(m).fill(0).map(()=>new Array(n).fill(0))
    let Q = []
    const actions = []
    const boards = []
    const turns = []

    for (let i in history) {
      let {key} = util.getMinPosKeyBoard(board)
      let { player, x, y } = history[i]
      const state = this.states[i][key]
      if ((i%2)===(p-1)) {
        if (!state) {
          console.error('no state for key',key,i,board)
          throw new Error('no state')
        }
        Q.push(state)
        actions.push(this.xyToPos(x,y,n))
        boards.push(board.map((r)=>r.slice()))
        turns.push(i)
      }
      board[x][y] = player
    }
    let reward = this.rDie
    if (winner === undefined) reward = this.rTie
    if (winner === p) reward = this.rWin

    if (this.count%1000 === 0) console.log(Q)
    this.qLearn(Q, actions, reward)
    if (this.count%1000 === 0) console.log(Q)
    if (this.count%1000 === 0) console.log({reward})

    for (let i in Q) {
      let b = boards[i]
      let q = Q[i]
      const turn = turns[i]
      for (let j=0; j<4; j++) {
        if (b.length === m) {
          this.states[turn][this.getBoardKey(b)] = q
        }
        if (b.length === n) {
          let qi = this.invertArray1D(q,b.length,b[0].length)
          this.states[turn][this.getBoardKey(this.invertArray(b))] = qi
        }
        q = this.rotateArray1DRight(q,b.length,b[0].length)
        b = this.rotateArrayRight(b)
      }
    }
  }

  play(info, done) {
    const { board, turn, n } = info

    const openMoves = []
    const next = (turn % 2) + 1

    for (let x in board.length) {
      for (let y in board[0].length) {
        let state = undefined
        if (board[x][y]!==0) {
          state = 0
        } else {
          const aBoard = board.map((r,i) => x===i ? r.slice() : r )
          aBoard[x][y] = next
          const {key} = util.getMinPosKeyBoard([x,y],aBoard)
          state = this.states[turn][key]
          if (!state) state = this.states[turn][key] = this.Qinit
        }
        openMoves.push(state)
      }
    }

    const selectRandom = (selection) => {
      if (!selection.length) {
        console.error(state,selection)
        throw new Error('no selections?')
      }
      return selection[this.getRandomInt(0,selection.length)]
    }

    const maxScore = Math.max.apply(null,openMoves)*(1-this.epsilon)

    let pos = selectRandom(openMoves.reduce((r,move,i)=>{
      if (move>=maxScore) r.push(i)
      return r
    },[]))

    let {x,y} = this.posToXy(pos,n)
    if (board[x][y] !== 0) {
      console.error('invalid position!',state)
      console.error(board,key,{x,y})
    }
    return done({x,y})
  }

  getRandomInt(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min
  }

  getBoardKey(board) {
    const s = board.map((x)=>x.join('')).join('')
    const r = Number.parseInt(s,3)
    return r
  }

  posToXy(i,n) {
    const x = Math.floor(i/n)
    const y = i-(x*n)
    return {x,y}
  }

  xyToPos(x,y,n) {
    return (x*n)+y
  }

  invertPosition(i, m, n) {
    const xy = this.posToXy(i,n)
    return this.xyToPos(xy.y,xy.x,m)
  }

  invertArray1D(array,m,n) {
    let newArray = array.slice()
    for (let i=0; i<m*n; i++) {
      const r = this.invertPosition(i,m,n)
      newArray[r] = array[i]
    }
    return newArray
  }

  rotateIndexRight(i,m,n) {
    const y = Math.floor(i/n)
    const x = i-(y*n)
    const r = (x*m)+(m-y-1)
    return r
  }

  rotateArray1DRight(array,m,n) {
    let newArray = array.slice()
    for(let i=0; i<m*n; i++) {
      const r = this.rotateIndexRight(i,m,n)
      newArray[r]=array[i]
    }
    return newArray
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

module.exports = QLearnPlayer
