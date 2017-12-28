class QLearnPlayer {
  constructor({m,n}) {
    this.learningRate = 0.001
    this.epsilon = 0.2
    this.Qinit = 0.1
    this.Qmin = 0.001
    this.Qmax = 1
    this.count = 0
    this.discount = 1
    this.states = new Array((m*n)+1).fill().map(()=>new Object())
    Object.keys(this).forEach((key)=> {
      Object.defineProperty(this, key, {enumerable:false})
    })
  }

  learnPlay(Q, actions, reward) {
    Q = Q.map((r)=>r.slice())
    let maxQ = 0
    let l = this.learningRate
    let d = this.discount
    for (let i=Q.length-1; i>=0; i--) {
      const a = actions[i]
      const q = Q[i][a]
      const r1 = (1-l)*q
      const r2 = l*(reward+(d*maxQ))
      let r = r1 + r2
      // console.log(q,'->',r,';',r1,r2)
      if (r<this.Qmin) r = this.Qmin
      if (r>this.Qmax) r = this.Qmax
      Q[i][a] = r
      maxQ = Math.max.apply(null,Q[i])
    }
    return Q
  }

  learnGame({ winner, history, m, n }, p) {
    this.count++
    const board = new Array(m).fill(0).map(()=>new Array(n).fill(0))
    let Q = []
    const actions = []
    const boards = []
    const turns = []
    for (let i in history) {
      let key = this.getBoardKey(board)
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
    let reward = -1
    if (winner === undefined) reward = 0.5
    if (winner === p) reward = 1
    if (this.count%1000 === 0) console.log(Q)
    Q = this.learnPlay(Q, actions, reward)
    if (this.count%1000 === 0) console.log(Q)
    if (this.count%1000 === 0) console.log({reward})
    for (let i in Q) {
      let b = boards[i]
      let q = Q[i]
      const turn = turns[i]
      // this.states[turn][this.getBoardKey(b)] = q
      for (let j=0; j<4; j++) {
        if (b.length === m) {
          this.states[turn][this.getBoardKey(b)] = q
        }
        if (b.length === n) {
          let qi = this.invertArray1D(q,b.length,b[0].length)
          this.states[turn][this.getBoardKey(this.invertArray(b))] = qi
        }
        // console.log(b,q)
        q = this.rotateArray1DRight(q,b.length,b[0].length)
        b = this.rotateArrayRight(b)
      }
    }
  }

  play(info, done) {
    const { board, turn, n } = info
    const key = this.getBoardKey(board)
    // console.log({board,key})
    let state = this.states[turn][key]
    if (!state) {
      state = board.reduce((result,row)=>result.concat(row.map((v)=>{
        if (v===0) return this.Qinit
        else return 0
      })),[])
      this.states[turn][key] = state
    } else {
      // console.log(board,state)
    }

    const selectRandom = (selection) => {
      if (!selection.length) {
        console.error(state,selection)
        throw new Error('no selections?')
      }
      return selection[this.getRandomInt(0,selection.length)]
    }

    const maxScore = Math.max.apply(null,state)*(1-this.epsilon)

    let pos = selectRandom(state.reduce((r,move,i)=>{
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
    // return board.map((x)=>x.join('')).join(':')
    // const d = board.length - board[0].length
    // const j = ( d> 0 ? new Array(d).fill(0).join('') : '')
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
