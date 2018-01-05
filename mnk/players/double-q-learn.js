class DoubleQLearnPlayer {
  constructor({m,n}) {
    this.learningRate = 0.001
    this.epsilon = 0.9
    this.Qinit = [0.1,0.01]
    this.Qmin = 0.001
    this.Qmax = 1.0
    this.rWin = 1.0
    this.rTie = 0.1
    this.rDie = -1.0
    this.count = 0
    this.discountWin = 0
    this.discountTie = 0.5
    this.discountDie = 1
    this.states = new Array(this.Qinit.length).fill().map(()=>{
      return new Array((m*n)+1).fill().map(()=>new Object())
    })
    Object.keys(this).forEach((key)=> {
      Object.defineProperty(this, key, {enumerable:false})
    })
  }

  qLearn(Q1, Q2, actions, reward, discount, learningRate=this.learningRate) {
    // Q = Q.map((r)=>r.slice())
    let maxQ = 0
    const l = learningRate
    const d = discount
    const r = reward
    for (let t=Q1.length-1; t>=0; t--) {
      const a = actions[t]
      const q = Q1[t][a]
      let v = (1-l)*q + l*(r+d*maxQ)
      if (v<this.Qmin) v = this.Qmin
      if (v>this.Qmax) v = this.Qmax
      Q1[t][a] = v
      if (d===0) continue
      const argMaxQ1 = Q1[t].reduce((m, x, i, a) => x > a[m] ? i : m, 0)
      maxQ = Q2[t][argMaxQ1]
    }
    // return Q
  }

  learnGame({ winner, history, m, n }, p) {
    this.count++
    const board = new Array(m).fill(0).map(()=>new Array(n).fill(0))
    let Q1 = []
    let Q2 = []
    const actions = []
    const boards = []
    const turns = []
    let s1 = this.getRandomInt(0,this.states.length-1)
    let s2 = this.getRandomInt(0,this.states.length-2)
    if (s2>=s1) s2 += 1

    for (let i in history) {
      let key = this.getBoardKey(board)
      let { player, x, y } = history[i]
      const state1 = this.states[s1][i][key]
      const state2 = this.states[s2][i][key]
      if ((i%2)===(p-1)) {
        if (!state1 || !state2) {
          console.error('no state for key',key,i,board)
          console.error(s1,s2,state1,state2)
          throw new Error('no state')
        }
        Q1.push(state1)
        Q2.push(state2)
        actions.push(this.xyToPos(x,y,n))
        boards.push(board.map((r)=>r.slice()))
        turns.push(i)
      }
      board[x][y] = player
    }

    let discount = this.discountDie
    let reward = this.rDie

    if (winner === undefined) {
      reward = this.rTie
      discount = this.discountTie
    }

    if (winner === p)  {
      reward = this.rWin
      discount = this.discountWin
    }

    if (this.count%1000 === 0) console.log(Q1)
    this.qLearn(Q1, Q2, actions, reward, discount)
    if (this.count%1000 === 0) console.log(Q1)
    if (this.count%1000 === 0) console.log({reward})

    for (let i in Q1) {
      let b = boards[i]
      let q = Q1[i]
      const turn = turns[i]
      for (let j=0; j<4; j++) {
        if (b.length === m) {
          this.states[s1][turn][this.getBoardKey(b)] = q
        }
        if (b.length === n) {
          let qi = this.invertArray1D(q,b.length,b[0].length)
          this.states[s1][turn][this.getBoardKey(this.invertArray(b))] = qi
        }
        q = this.rotateArray1DRight(q,b.length,b[0].length)
        b = this.rotateArrayRight(b)
      }
    }
  }

  play(info, done) {
    const { board, turn, n } = info
    const key = this.getBoardKey(board)
    const s = this.getRandomInt(0,this.states.length-1)

    for (let i in this.states) {
      if (this.Qinit[i] === undefined) throw new Error(`Qinit[${i}] not defined`)
      if (this.states[i][turn][key]) continue
      this.states[i][turn][key] = board.reduce((result,row)=>result.concat(row.map((v)=>{
        if (v===0) return this.Qinit[i]
        else return 0
      })),[])
    }

    let state = this.states[s][turn][key]

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

module.exports = DoubleQLearnPlayer
