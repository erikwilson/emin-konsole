class QLearnPlayer {
  constructor({m,n}) {
    this.metadata = {
      learningRate: 0.001,
    }
    this.count = 0
    this.moves = this.baseStats({m,n})
    Object.keys(this).forEach((key)=> {
      Object.defineProperty(this, key, {enumerable:false})
    })
  }

  getIterations(i) {
    let base = [ [0], [1], [2] ]
    if (i<=1) return base
    let r = []
    for (let n of this.getIterations(i-1)) {
      base.forEach((b)=>r.push(n.concat(b)))
    }
    return r
  }

  baseStats({m,n}) {
    return this.getIterations(m*n).reduce((r,b)=> {
      r[b.join('')]=b.map(v=>v===0?.1:0)
      return r
    },{})
  }

  train(inputs, labels, learningRate=this.metadata.learningRate) {
    for (let i in inputs) {
      const bStr = inputs[i].join('')
      const move = this.moves[bStr]
      const expected = labels[i]
      for (let j in move) {
        if (move[j] > expected[j]) {
          if ((move[j]-expected[j])<learningRate) move[j] = expected[j]
          else move[j] -= learningRate
        }
        if (move[j] < expected[j]) {
          if ((expected[j]-move[j])<learningRate) move[j] = expected[j]
          else move[j] += learningRate
        }
      }
      this.moves[bStr] = move
    }
  }

  learnPlay(board, pos, player, winner, i, l, m, n, p) {
    if (player!==p) return
    const won = (winner === undefined || winner === undefined)

    let move = this.moves[board.join('')].map((p,j)=>{
      if (board[j]!==0) return 0
      if (p<0.01) return 0.01
      return p
    })

    if (winner === player) move[pos] = 1
    else if (winner === undefined) move[pos] = 0.5
    else move[pos] = 0.01

    const rboards = this.getMirrors(board,m,n)
    const rmoves = this.getMirrors(move,m,n)
    const sboards = []
    const boards = []
    const moves = []
    rboards.forEach((b,j)=> {
      const str = b.join('')
      if (sboards.includes(str)) return
      sboards.push(str)
      boards.push(rboards[j])
      moves.push(rmoves[j])
    })
    let learningRate = this.metadata.learningRate * (i+1)/l
    if (!won) learningRate *= 100.
    // console.log(winner,won,player,p,learningRate)
    this.train(boards,moves,learningRate)
  }

  learnGame({ winner, history, m, n }, p) {
    const board = new Array(m*n).fill(0)
    const l = history.length
    for (let i in history) {
      let { player, x, y } = history[i]
      const pos = this.xyToPos(x,y,n)
      this.learnPlay(board, pos, player, winner, i, l, m, n, p)
      board[pos] = player
    }
  }

  play(info, done) {
    const { m, n, board, turn } = info
    const input = [].concat(...board)
    let result = this.moves[input.join('')]
    const oresult = Array.from(result)

    for (let _ in result) {
      let maxResult = Math.max.apply(null,result)*0.1
      const allMatch = result.reduce((r,p,i) => {
        if (maxResult>0 && p<maxResult) return r
        if (input[i]===0) r.push(i)
        return r
      }, [])
      // console.log(turn,allMatch.length,maxResult)
      if (allMatch.length>0) {
        const pos = allMatch[this.getRandomInt(0,allMatch.length)]
        oresult[pos] += ' *'
        if (this.count++ % 1000 === 0) console.log({input,oresult})
        const { x, y } = this.posToXy(pos,n)
        return done({x,y})
      }
    }
    console.error({input,oresult,result})
    throw new Error('unable to find a move!')
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

  invertArray1D(array,m,n) {
    let newArray = array.slice()
    for (let i=0; i<m*n; i++) {
      const r = this.invertPosition(i,m,n)
      newArray[r] = array[i]
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

  rotateArray1DRight(array,m,n) {
    let newArray = array.slice()
    for(let i=0; i<m*n; i++) {
      const r = this.rotateIndexRight(i,m,n)
      newArray[r]=array[i]
    }
    return newArray
  }

  getMirrors(array, M, N) {
    const mirrors = [array.slice()]
    let [ m, n ] = [ M, N ]
    for (let i=1; i<4; i++) {
      const array = this.rotateArray1DRight(mirrors[i-1],m,n)
      mirrors.push(array)
      if (i!==3) [ m, n ] = [ n, m ]
    }
    for (let i=0; i<4; i++) {
      const array = this.invertArray1D(mirrors[i],m,n)
      mirrors.push(array)
      if (i!==3) [ m, n ] = [ n, m ]
    }
    return mirrors
  }

}

module.exports = QLearnPlayer
