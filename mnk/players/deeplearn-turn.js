const DeepLearn = require('deeplearn')

const { Array1D, ZerosInitializer, OnesInitializer } = DeepLearn
const { RandomUniformInitializer, VarianceScalingInitializer } = DeepLearn
const { InCPUMemoryShuffledInputProviderBuilder } = DeepLearn
const { CostReduction, SGDOptimizer, AdamOptimizer } = DeepLearn
const { Graph, Session, NDArrayMathCPU } = DeepLearn
const GraphSerializer = require('deeplearn-graph-serializer')

class DeepLearnTurnPlayer {
  constructor({m,n}) {
    this.math = new NDArrayMathCPU()
    this.turns = []
    this.inputs = {}
    this.labels = {}
    this.metadata = {
      learningRate: 0.1,
    }
    this.sampleSize = 100
    this.count = 0
    this.create({m,n})
    Object.keys(this).forEach((key)=> {
      Object.defineProperty(this, key, {enumerable:false})
    })
    // console.log(this.rotateArray1DRight([1,2,3,4,5,6,0],2,3))
    // console.log(this.invertArray1D([1,2,3,4,5,6,0],2,3))
  }

  create({m,n}) {
    const zeros = new ZerosInitializer()
    const ones = new OnesInitializer()
    const rand = new RandomUniformInitializer(0,1)
    const scale = new VarianceScalingInitializer(.1,'fan_in','uniform')
    const scale2 = new VarianceScalingInitializer(1,'fan_out','uniform')
    const inSize = m*n
    const hiddenSize = 128 //(m*n)**3
    const outSize = m*n

    for (let i=0; i<m*n; i++) {
      this.inputs[i] = []
      this.labels[i] = []

      const graph = new Graph()
      const input = graph.placeholder('input', [inSize])
      const label = graph.placeholder('label', [outSize])

      let fullyConnectedLayer = graph.layers.dense('layerIn', input, hiddenSize, null, true, scale, scale2)//, zeros, scale)
      // fullyConnectedLayer = graph.layers.dense('layerHidden1', fullyConnectedLayer, hiddenSize, null, true, scale)//, zeros, scale)
      // fullyConnectedLayer = graph.layers.dense('layerHidden2', fullyConnectedLayer, hiddenSize, null, true, scale)//, zeros, scale)
      const output = graph.layers.dense('layerOut', fullyConnectedLayer, outSize, null, true, scale, scale2)//, zeros, scale)
      graph.variable('output', output)

      const cost = graph.meanSquaredCost(label, output)
      graph.variable('cost', cost)
      this.turns.push({
        graph,
        placeholders: { input, label },
        variables: { cost, output },
      })
    }
  }

  toJson() {
    return this.turns.map((turn) => GraphSerializer.graphToJson(turn.graph))
  }

  async train(net, inputs, labels, learningRate=this.metadata.learningRate, batchSize=1, rounds=1) {
    inputs = inputs.map((m)=>{
      const r = new Array(m.length*2).fill(0)
      m.forEach((p,i)=>{
        if (p===0) return
        r[m.length*(p-1)+i] = 1
      })
      return Array1D.new(r)
    })
    labels = labels.map(m=>Array1D.new(m))

    const { math } = this
    const { graph, placeholders, variables } = net
    const { input, label } = placeholders
    const { cost } = variables

    const session = new Session(graph, math)
    const optimizer = new SGDOptimizer(learningRate)
    // const optimizer = new AdamOptimizer(learningRate, 0.9, 0.999)
    const shuffledInputProviderBuilder =
        new InCPUMemoryShuffledInputProviderBuilder([inputs, labels])
    const [inputProvider, labelProvider] =
        shuffledInputProviderBuilder.getInputProviders()

    const feedEntries = [
      {tensor: input, data: inputProvider},
      {tensor: label, data: labelProvider},
    ]

    for (let i=0; i<rounds; i++) {
      math.scope(async () => {
        session.train(cost, feedEntries, batchSize, optimizer, CostReduction.NONE)
        // console.log({costVal})
      })
    }
  }

  run(net, data) {
    data = Array1D.new(data.reduce((r,p,i)=>{
      if (p===0) return r
      r[data.length*(p-1)+i] = 1
      return r
    },new Array(data.length*2).fill(0)))

    const { math } = this
    const { graph, placeholders, variables } = net
    const { input } = placeholders
    const { output } = variables
    const session = new Session(graph, math)
    const feedEntries = [{tensor: input, data}]
    return session.eval(output, feedEntries)
  }

  async learnGame({ winner, history, m, n}) {
    // let {inputs,labels,sampleSize} = this
    // const input = new Array(m*n*2).fill(0)
    const board = new Array(m*n).fill(0)
    for (let i in history) {
      i = i/1
      let shouldTrain = false
      let { player, x, y } = history[i]
      const pos = this.xyToPos(x,y,n)
      // const id = player>1?-1:player
      let move = await this.run(this.turns[i],board.map(v=>v===2?-1:v)).getValues().map((p,i)=>{
        if (p<0) return Math.abs(p)
        if (board[i]!==0) return 0
        return p
      })
      // const move = new Array(m*n).fill(0)

      if (winner === undefined || winner === player) {
        // if (winner === undefined) move[pos] = 1
        // else move[pos] = 1
        // move[pos] = 1 - (1-move[pos])*((history.length-i-1)/history.length)
        // move = await this.run(this.turns[i],input).getValues()
// .map((p,i)=>{
//           if (board[i]!==0) return 0
//           return p
//         })
        move[pos] = 1
        shouldTrain = true
      } else {
        // move[pos] = 0
        // if (i>=(history.length-4)) {
        board.forEach((p,i) => { if (i<m*n && p===0) move[i]*=.9 })
        // move[pos] *= (history.length-i-1)/history.length
        move[pos] = 0
        // move = new Array(m*n).fill(0)
        shouldTrain = true
        // }
      }
      if (i%2!==0 && shouldTrain) {
        const boards = this.getMirrors(board.map(v=>v===2?-1:v),m,n)
        // if (winner === undefined) console.log({board:boards[0],move})

        // const mirrors = boards.reduce((r,v,i)=>{
        //   let d = i%2 ? [n,m] : [m,n]
        //   let s = `${v.join('')}:${d[0]},${d[1]}`
        //   if (r[s]) return r
        //   r[s] = {v,i,d}
        //   return r
        // },{})
        // const minMirror = mirrors[Object.keys(mirrors).sort()[0]]

        const moves = this.getMirrors(move,m,n)
        const learningRate = this.metadata.learningRate * (i+1)/history.length
        // if (winner===undefined) console.log(boards,moves)
        // const boards = [Array1D.new(board)]
        // const moves = [Array1D.new(move)]
        // this.train(
        //   this.turns[i],
        //   [minMirror.v].map(m=>Array1D.new(m.map(v=>v===2?-1:v))),
        //   [moves[minMirror.i]].map(m=>Array1D.new(m)),
        //   learningRate
        // )
        this.train(
          this.turns[i],
          boards.map(m=>Array1D.new(m)),
          moves.map(m=>Array1D.new(m)),
          learningRate
        )
      }
      // if (winner===undefined) console.log({board,move})
      board[pos] = player
      // input[(m*n)*(player-1)+pos] = 1
      // board[pos] = id
    }
    // if (inputs.length > sampleSize) inputs = this.inputs = inputs.slice(-sampleSize)
    // if (labels.length > sampleSize) labels = this.labels = labels.slice(-sampleSize)
    // await this.train(inputs,labels,undefined,(winner===undefined?1:1))
  }

  async play(info, done) {
    const { m, n, board, turn } = info
    // console.log(JSON.stringify(board,null,2))
    // const mirrors = this.getMirrors([].concat(...board),m,n).reduce((r,v,i)=>{
    //   let d = i%2 ? [n,m] : [m,n]
    //   let s = `${v.join('')}:${d[0]},${d[1]}`
    //   if (r[s]) return r
    //   r[s] = {v,i,d}
    //   return r
    // },{})
    // const minMirror = mirrors[Object.keys(mirrors).sort()[0]]
    // const input = minMirror.v.map((v)=>v===2?-1:v)
    // input[input.length-1] = Math.random()
    // for (let i=0; i<m; i++) {
    //   for (let j=0; j<n; j++) {
    //     let player = board[i][j]
    //     const id = player>1?-1:player
    //     if (player===0) continue
    //     const pos = this.xyToPos(i,j,n)
    //     // input[(m*n)*(player-1)+pos] = 1
    //     input[pos] = id
    //   }
    // }
    const input = [].concat(...board).map(v=>v===2?-1:v)
    let result = Array.from(await this.run(this.turns[turn],input).getValues()).map(v=>Math.abs(v))
    const oresult = Array.from(result)
    if (this.count++ % 1000 === 0) console.log({input,oresult})
    // if (minMirror.i !== 0) {
    //   const results = this.getMirrors(result,minMirror.d[0],minMirror.d[1])
    //   let newi = 0
    //   if (minMirror.i < 4) {
    //     newi = 4 - minMirror.i
    //     if (newi === 4) newi = 0
    //   } else {
    //     newi = 4 + (8 - minMirror.i)
    //     if (newi === 8) newi = 4
    //   }
    //   result = results[newi]
    // }

    for (let _ in result) {
      let maxResult = Math.max.apply(null,result)
      maxResult *= maxResult>0 ? 0.5 : 2

      const allMatch = result.reduce((r,p,i) => {
          if (p<maxResult) return r
          // const {x,y} = this.posToXy(i,n)
          // if (board[x][y]===0) r.push(i)
          if (input[i]===0) r.push(i)
          else result[i] = Number.MIN_SAFE_INTEGER
          return r
      }, [])
      // console.log(turn,allMatch.length,maxResult)
      if (allMatch.length>0) {
        const pos = allMatch[this.getRandomInt(0,allMatch.length)]
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

module.exports = DeepLearnTurnPlayer
