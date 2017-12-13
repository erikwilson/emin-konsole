const DeepLearn = require('deeplearn')

const { Array1D, ZerosInitializer, OnesInitializer } = DeepLearn
const { RandomUniformInitializer, VarianceScalingInitializer, ConstantInitializer } = DeepLearn
const { InCPUMemoryShuffledInputProviderBuilder } = DeepLearn
const { CostReduction, SGDOptimizer, AdamOptimizer } = DeepLearn
const { Graph, Session, NDArrayMathCPU } = DeepLearn
const GraphSerializer = require('deeplearn-graph-serializer')

class DeepLearnBase {
  constructor({m,n}) {
    this.math = new NDArrayMathCPU()
    this.metadata = {
      learningRate: 0.2,
    }
    this.create({m,n})
    // this.learn({m,n})
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
    const scale = new VarianceScalingInitializer(1,'fan_avg','normal')
    const scale2 = new VarianceScalingInitializer(1,'fan_in','normal')
    const c = new ConstantInitializer(0.5)
    const inSize = m*n
    const hiddenSize = m*n*4 //(m*n)**3
    const outSize = m*n

    const graph = new Graph()
    const input = graph.placeholder('input', [inSize])
    const label = graph.placeholder('label', [outSize])

    let fullyConnectedLayer = graph.layers.dense('layerIn', input, hiddenSize, null, true)//, scale2)//, scale)
    // fullyConnectedLayer = graph.layers.dense('layerHidden1', fullyConnectedLayer, hiddenSize, null, true, scale)//, scale)
    // fullyConnectedLayer = graph.layers.dense('layerHidden2', fullyConnectedLayer, hiddenSize, null, true, scale)//, scale)
    const output = graph.layers.dense('layerOut', fullyConnectedLayer, outSize, null, true)//, scale2)//, scale)
    graph.variable('output', output)

    const cost = graph.meanSquaredCost(label, output)
    graph.variable('cost', cost)
    this.net = {
      graph,
      placeholders: { input, label },
      variables: { cost, output },
    }
  }

  toJson() {
    return this.turns.map((turn) => GraphSerializer.graphToJson(turn.graph))
  }

  async train(net, inputs, labels, learningRate=this.metadata.learningRate, batchSize = 1, rounds=1000) {
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
      let pass = 0
      for (let i=0; i<rounds; i++) {
          let costVal = await session.train(cost, feedEntries, batchSize, optimizer, CostReduction.MEAN).val()
          if (i%100===0) console.log(i,rounds,{costVal})
          if (costVal === 0) return// pass++
          if (pass>(rounds*.05)) return
      }
    })
  }

  run(net, data) {
    data = Array1D.new(data)
    const { math } = this
    const { graph, placeholders, variables } = net
    const { input } = placeholders
    const { output } = variables
    const session = new Session(graph, math)
    const feedEntries = [{tensor: input, data}]
    return session.eval(output, feedEntries)
  }

  getIterations(i) {
    let base = [ [0], [1], [-1] ]
    if (i<=1) return base
    let r = []
    for (let n of this.getIterations(i-1)) {
      base.forEach((b)=>r.push(n.concat(b)))
    }
    return r
  }

  async learn() {
    // const board = new Array(m*n).fill(0)
    // console.log(this.getIterations(9))
    const boards = this.getIterations(9)
    const moves  = boards.map(b=>b.map(v=>v===0?0.5:0))
    // const inputs = boards.map((b)=> {
    //   const newB = new Array(b.length*2).fill(0)
    //   b.forEach((m,i) => {
    //     if (m===0) return
    //     newB[ b.length*(m-1)+i ] = 1
    //   })
    //   return newB
    // })
    await this.train(
      this.net,
      boards.map(m=>Array1D.new(m)),
      moves.map(m=>Array1D.new(m)),
      0.2, 3, boards.length,
    )
    // await this.train(
    //   this.net,
    //   inputs.map(m=>Array1D.new(m)),
    //   moves.map(m=>Array1D.new(m)),
    //   0.01, 10, 1000,
    // )
    // await this.train(
    //   this.net,
    //   inputs.map(m=>Array1D.new(m)),
    //   moves.map(m=>Array1D.new(m)),
    //   0.001, 100, 100,
    // )
    const testNum = 10000
    const result = await this.run(this.net,boards[testNum]).getValues()
    console.log(boards[testNum],moves[testNum])
    console.log({result})
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

const dlb = new DeepLearnBase({m:3,n:3})
;(async ()=>{
  await dlb.learn()
})().catch((error)=>{
  console.error(error)
})
