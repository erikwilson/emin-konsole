const DeepLearn = require('deeplearn')

const { Array1D, ZerosInitializer, OnesInitializer } = DeepLearn
const { RandomUniformInitializer, VarianceScalingInitializer } = DeepLearn
const { InCPUMemoryShuffledInputProviderBuilder } = DeepLearn
const { CostReduction, SGDOptimizer, AdamOptimizer } = DeepLearn
const { Graph, Session, NDArrayMathCPU } = DeepLearn
const { jsonToGraph, graphToJson } = require('deeplearn-graph-serializer')

class DeepLearnTurnPlayer {
  constructor({m,n}) {
    this.math = new NDArrayMathCPU()
    this.turns = []
    this.metadata = {
      learningRate: 0.001,
    }
    this.count = 0
    const baseNet = this.create({m,n})
    this.baseLearn(baseNet,{m,n}).then(async ()=>{
      // const input = [2,2,2,2,2,2,2,2,0]
      // let result = Array.from(await this.run(baseNet,input).getValues())
      // console.log({result})
      const netJson = graphToJson(baseNet.graph)
      for (let i=0; i<(m*n); i++) {
        this.turns[i] = jsonToGraph(netJson)
      }
    })
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

  async baseLearn(net,{m,n}) {
    const boards = this.getIterations(m*n)
    const moves  = boards.map(b=>b.map(v=>v===0?0.5:-1))
    await this.train(net, boards, moves, 0.01, 1, 5000)
  }

  create({m,n}) {
    const inSize = m*n*2
    const hiddenSize = inSize*2
    const outSize = m*n
    const graph = new Graph()
    const input = graph.placeholder('input', [inSize])
    const label = graph.placeholder('label', [outSize])
    const hidden = graph.layers.dense('layerHidden1', input, hiddenSize, null, true)
    const output = graph.layers.dense('layerOut', hidden, outSize, null, true)
    graph.variable('output', output)
    const cost = graph.meanSquaredCost(label, output)
    graph.variable('cost', cost)
    return {
      graph,
      placeholders: { input, label },
      variables: { cost, output },
    }
  }

  toJson() {
    return this.turns.map((turn) => GraphSerializer.graphToJson(turn.graph))
  }

  async train(net, inputs, labels, learningRate=this.metadata.learningRate, batchSize=1, rounds=1) {
    inputs = inputs.map((m)=>{
      return Array1D.new(m.reduce((r,p,i)=>{
        if (p===0) return r
        r[m.length*(p-1)+i] = 1
        return r
      },new Array(m.length*2).fill(0)))
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

    await math.scope(async () => {
      for (let i=0; i<rounds; i++) {
        const costVal = await session.train(cost, feedEntries, batchSize, optimizer, CostReduction.MEAN).val()
      }
    })
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
    const board = new Array(m*n).fill(0)
    for (let i in history) {
      i = i/1
      let { player, x, y } = history[i]
      const pos = this.xyToPos(x,y,n)
      let move = await this.run(this.turns[i],board).getValues().map((p,i)=>{
        if (board[i]!==0) return -1
        if (p<0) return 0
        return p
      })

      let doTraining = false
      if (winner === undefined || winner === player) {
        // move = move.map(p=>p>0?p*.9:p)
        // move = move.map(p=>p>0?p*0.9:p)
        move[pos] = 1
        // if (move[pos]>1) move[pos] = 1
        // if ((history.length-i)<=7) doTraining = true
        doTraining = true
      } else {
        // move = move.map(p=>p>0?p*1.1:p)
        move[pos] /= 2
        // if ((history.length-i)<=5) doTraining = true
        doTraining = true
      }

      if (i%2 && doTraining) {
        const rboards = this.getMirrors(board,m,n)
        const rmoves = this.getMirrors(move,m,n)
        const sboards = []
        const boards = []
        const moves = []
        rboards.forEach((b,i)=> {
          const str = b.join('')
          if (sboards.includes(str)) return
          sboards.push(str)
          boards.push(rboards[i])
          moves.push(rmoves[i])
        })
        const learningRate = this.metadata.learningRate * (i+1)/history.length
        await this.train(this.turns[i],boards,moves,learningRate,boards.length)
      }
      board[pos] = player
    }
  }

  async play(info, done) {
    const { m, n, board, turn } = info
    const input = [].concat(...board)
    let result = Array.from(await this.run(this.turns[turn],input).getValues())
    const oresult = Array.from(result)

    for (let _ in result) {
      let maxResult = Math.max.apply(null,result)
      // maxResult *= maxResult>0 ? 0.75 : 1.25

      const allMatch = result.reduce((r,p,i) => {
        if (p<maxResult) return r
        if (input[i]===0) r.push(i)
        else result[i] = Number.MIN_SAFE_INTEGER
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

module.exports = DeepLearnTurnPlayer
