const DeepLearn = require('deeplearn')

const { Scalar, Array1D } = DeepLearn
const { InCPUMemoryShuffledInputProviderBuilder } = DeepLearn
const { CostReduction, FeedEntry, SGDOptimizer } = DeepLearn
const { Graph, Session, NDArrayMathCPU } = DeepLearn

class DeepLearnPlayer {
  constructor() {
    this.math = new NDArrayMathCPU()
    const learner = this.create()
    this.metadata = learner.metadata
    this.net = learner.net
  }

  create() {
    const graph = new Graph()
    const input = graph.placeholder('input', [10])
    const label = graph.placeholder('label', [9])

    let fullyConnectedLayer = graph.layers.dense(`layerIn`, input, 100)
    fullyConnectedLayer = graph.layers.dense(`layerHidden1`, fullyConnectedLayer, 100)
    fullyConnectedLayer = graph.layers.dense(`layerHidden2`, fullyConnectedLayer, 100)
    const output = graph.layers.dense(`layerOut`, fullyConnectedLayer, 9)
    graph.variable('output', output)

    const cost = graph.meanSquaredCost(label, output)
    graph.variable('cost', cost)

    return {
      metadata: {
        learningRate: .0001,
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

    for (let i in inputs) { inputs[i] = Array1D.new(inputs[i]) }
    for (let i in labels) { labels[i] = Array1D.new(labels[i]) }

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
      await math.scope(async () => {
        const costVal = await session.train(cost, feedEntries, batchSize, optimizer, CostReduction.MEAN).val(0)
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

  async learnGame({ players, winner, rank, history }) {
    const inputs = []
    const labels = []
    for (let p=1; p<=players; p++) {
      if (winner !== undefined && winner !== p) continue
      const board = new Array((rank**2)+1).fill(0)
      for (let move of history) {
        let { player, x, y } = move
        const pos = this.xyToPos(x,y,rank)
        if (player === p) {
          board[board.length-1] = Math.random()
          const move = new Array(rank**2).fill(-1)
          move[pos] = 1
          inputs.push(board.slice())
          labels.push(move)
          player = 1
        } else {
          if (player < p) player = -player
          else player = -(player-1)
        }
        board[pos] = player
      }
    }
    await this.train(inputs,labels,undefined,(winner===undefined?10:1))
  }

  async play(info, done) {
    const { num, players, rank, board, turn } = info
    // console.log(JSON.stringify(board,null,2))
    const input = new Array((rank**2)+1).fill(0)
    input[input.length-1] = Math.random()
    for (let y=0; y<rank; y++) {
      for (let x=0; x<rank; x++) {
        let player = board[y][x]
        if (player === 0) continue
        if (player === num) player = 1
        else {
          if (player<num) player = -player
          else player = -(player-1)
        }
        input[this.xyToPos(x,y,rank)] = player
      }
    }
    const result = await this.run(input).getValues()
    while (true) {
      const max = result.reduce((a,b,i) => a[0]<b?[b,i]:a, [Number.MIN_SAFE_INTEGER,-1])
      const pos = max[1]
      const { x, y } = this.posToXy(pos,rank)
      if (board[y][x] === 0) return done({x,y})
      result[pos] = Number.MIN_SAFE_INTEGER
    }
  }

  posToXy(pos,rank) {
    const y = Math.floor(pos / rank)
    const x = pos-(y*rank)
    return {x,y}
  }

  xyToPos(x,y,rank) {
    return (y*rank)+x
  }

  rotateArray(array) {
    if (!array) return
    let result = []
    const ilength = array.length
    if (ilength<=0) return result
    const jlength = array[0].length

    for(let j = 0; j < jlength; j++){
      result.push([])
    }

    for(let j = 0; j < jlength; j++){
      for(let i = ilength-1; i>=0; i--){
        result[j].push(array[i][j])
      }
    }
    return result
  }

}

module.exports = DeepLearnPlayer
