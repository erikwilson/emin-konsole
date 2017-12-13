const DeepLearn = require('deeplearn')

const { Array1D, ZerosInitializer, OnesInitializer } = DeepLearn
const { InCPUMemoryShuffledInputProviderBuilder } = DeepLearn
const { CostReduction, SGDOptimizer } = DeepLearn
const { Graph, Session, NDArrayMathCPU } = DeepLearn
const GraphSerializer = require('deeplearn-graph-serializer')

class DeepLearnPlayer {
  constructor() {
    this.math = new NDArrayMathCPU()
    const learner = this.create()
    this.metadata = learner.metadata
    this.net = learner.net
    this.inputs = []
    this.labels = []
    this.sampleSize = 100
    Object.keys(this).forEach((key)=> {
      Object.defineProperty(this, key, {enumerable:false})
    })
  }

  create() {
    const zeros = new ZerosInitializer()
    const ones = new OnesInitializer()
    const graph = new Graph()
    const input = graph.placeholder('input', [10])
    const label = graph.placeholder('label', [9])

    let fullyConnectedLayer = graph.layers.dense('layerIn', input, 10, null, true, zeros, zeros)
    fullyConnectedLayer = graph.layers.dense('layerHidden1', fullyConnectedLayer, 10, null, true, zeros, zeros)
    fullyConnectedLayer = graph.layers.dense('layerHidden2', fullyConnectedLayer, 10, null, true, zeros, zeros)
    const output = graph.layers.dense('layerOut', fullyConnectedLayer, 9, null, true, zeros, zeros)
    graph.variable('output', output)

    const cost = graph.meanSquaredCost(label, output)
    graph.variable('cost', cost)

    return {
      metadata: {
        learningRate: .000000005,
      },
      net: {
        graph,
        placeholders: { input, label },
        variables: { cost, output },
      }
    }
  }

  async train(inputs, labels, learningRate=this.metadata.learningRate, rounds=1) {
    const { net, math } = this
    const { graph, placeholders, variables } = net
    const { input, label } = placeholders
    const { cost } = variables
    const batchSize = inputs.length

    const session = new Session(graph, math)
    const optimizer = new SGDOptimizer(learningRate)
    const shuffledInputProviderBuilder =
        new InCPUMemoryShuffledInputProviderBuilder([inputs, labels])
    const [inputProvider, labelProvider] =
        shuffledInputProviderBuilder.getInputProviders()

    const feedEntries = [
      {tensor: input, data: inputProvider},
      {tensor: label, data: labelProvider},
    ]

    for (let i=0; i<rounds; i++) {
      math.scope(() => {
        session.train(cost, feedEntries, batchSize, optimizer, CostReduction.MEAN)
        // console.log({costVal})
      })
    }
  }

  run(data) {
    data = Array1D.new(data)
    const { net, math } = this
    const { graph, placeholders, variables } = net
    const { input } = placeholders
    const { output } = variables
    const session = new Session(graph, math)
    const feedEntries = [{tensor: input, data}]
    return session.eval(output, feedEntries)
  }

  async learnGame({ winner, history, m, n},player) {
    if (winner !== undefined && winner !== player) return
    let {inputs,labels,sampleSize} = this
    const board = new Array((m*n)+1).fill(0)
    for (let move of history) {
      let { player, x, y } = move
      const pos = this.xyToPos(x,y,n)
      const id = player===1?1:-1
      if (winner === undefined || winner === player) {
        // board[board.length-1] = Math.random()
        const move = new Array(m*n).fill(0)
        move[pos] = id
        inputs.push(Array1D.new(board.slice()))
        labels.push(Array1D.new(move))
      }
      board[pos] = id
    }
    if (inputs.length > sampleSize) inputs = this.inputs = inputs.slice(-sampleSize)
    if (labels.length > sampleSize) labels = this.labels = labels.slice(-sampleSize)
    await this.train(inputs,labels,undefined,(winner===undefined?1:1))
  }

  // async learnGame({ winner, history, m, n, k }, player) {
  //   // if (winner !== undefined && winner !== player) return
  //   let {inputs,labels,sampleSize} = this
  //   // const inputs = []
  //   // const labels = []
  //   for (let p=1; p<=2; p++) {
  //     if (winner !== undefined && winner !== p) continue
  //     const board = new Array((m*n)+1).fill(0)
  //     for (let move of history) {
  //       let { player, x, y } = move
  //       const pos = this.xyToPos(x,y,n)
  //       if (player === p) {
  //         // board[board.length-1] = Math.random()
  //         const move = new Array(m*n).fill(0)
  //         move[pos] = 1
  //         inputs.push(Array1D.new(board.slice()))
  //         labels.push(Array1D.new(move))
  //         player = 1
  //       } else {
  //         if (player < p) player = -player
  //         else player = -(player-1)
  //       }
  //       board[pos] = player
  //     }
  //   }
  //   if (inputs.length > sampleSize) inputs = this.inputs = inputs.slice(-sampleSize)
  //   if (labels.length > sampleSize) labels = this.labels = labels.slice(-sampleSize)
  //   await this.train(inputs,labels,undefined,(winner===undefined?1:1))
  // }

  async play(info, done) {
    const { num, m, n, board } = info
    // console.log(JSON.stringify(board,null,2))
    const input = new Array((m*n)+1).fill(0)
    // input[input.length-1] = Math.random()
    for (let i=0; i<m; i++) {
      for (let j=0; j<n; j++) {
        let player = board[i][j]
        const id = player===1?1:-1
        input[this.xyToPos(i,j,n)] = id
      }
    }
    const result = await this.run(input).getValues()
    while (true) {
      const max = result.reduce((a,b,i) => a[0]<b?[b,i]:a, [Number.MIN_SAFE_INTEGER,-1])
      const pos = max[1]
      const { x, y } = this.posToXy(pos,n)
      if (board[x][y] === 0) return done({x,y})
      result[pos] = Number.MIN_SAFE_INTEGER
    }
  }

  // async play(info, done) {
  //   const { num, m, n, k, board } = info
  //   // console.log(JSON.stringify(board,null,2))
  //   const input = new Array((m*n)+1).fill(0)
  //   input[input.length-1] = Math.random()
  //   for (let i=0; i<m; i++) {
  //     for (let j=0; j<n; j++) {
  //       let player = board[i][j]
  //       if (player === 0) continue
  //       if (player === num) player = 1
  //       else {
  //         if (player<num) player = -player
  //         else player = -(player-1)
  //       }
  //       input[this.xyToPos(i,j,n)] = player
  //     }
  //   }
  //   const result = await this.run(input).getValues()
  //   while (true) {
  //     const max = result.reduce((a,b,i) => a[0]<b?[b,i]:a, [Number.MIN_SAFE_INTEGER,-1])
  //     const pos = max[1]
  //     const { x, y } = this.posToXy(pos,n)
  //     if (board[x][y] === 0) return done({x,y})
  //     result[pos] = Number.MIN_SAFE_INTEGER
  //   }
  // }

  posToXy(i,n) {
    const x = Math.floor(i/n)
    const y = i-(x*n)
    return {x,y}
  }

  xyToPos(x,y,n) {
    return (x*n)+y
  }

}

module.exports = DeepLearnPlayer
