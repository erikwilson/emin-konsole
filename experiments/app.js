const DeepLearn = require('deeplearn')
const { Scalar, Array1D } = DeepLearn
const { InCPUMemoryShuffledInputProviderBuilder } = DeepLearn
const { CostReduction, FeedEntry, SGDOptimizer } = DeepLearn
const { Graph, Session, NDArrayMathCPU } = DeepLearn
const GraphSerializer = require('deeplearn-graph-serializer')

const math = new NDArrayMathCPU()

function createNetwork() {
  const graph = new Graph()
  const input = graph.placeholder('input', [3])
  const label = graph.placeholder('label', [1])

  let fullyConnectedLayer = graph.layers.dense(`layerIn`, input, 3)
  // fullyConnectedLayer = graph.layers.dense(`layerHidden1`, fullyConnectedLayer, 3)
  const output = graph.layers.dense(`layerOut`, fullyConnectedLayer, 1)
  graph.variable('output', output)

  const cost = graph.meanSquaredCost(label, output)
  graph.variable('cost', cost)

  return { graph, cost, input, output, label }
}

function trainNetwork({ graph, cost, input, label }, rounds=1) {
  const learningRate = .000001
  const batchSize = 3
  const session = new Session(graph, math)
  const optimizer = new SGDOptimizer(learningRate)

  const inputs = [
    Array1D.new([1.0, 2.0, 3.0]),
    Array1D.new([10.0, 20.0, 30.0]),
    Array1D.new([100.0, 200.0, 300.0])
  ]

  const labels = [
    Array1D.new([4.0]),
    Array1D.new([40.0]),
    Array1D.new([400.0])
  ]

  const shuffledInputProviderBuilder =
     new InCPUMemoryShuffledInputProviderBuilder([inputs, labels])
  const [inputProvider, labelProvider] =
     shuffledInputProviderBuilder.getInputProviders()

  const feedEntries = [
    {tensor: input, data: inputProvider},
    {tensor: label, data: labelProvider}
  ]

  for (let i=0; i<rounds; i++) {
    math.scope(async () => {
      session.train(cost, feedEntries, batchSize, optimizer, CostReduction.MEAN)
    })
  }
}

function runNetwork({ graph, input, output }, values) {
  const session = new Session(graph, math);
  const data = Array1D.new(values);
  const feedEntries = [{tensor: input, data}]
  return session.eval(output, feedEntries)
}

function deserialNetwork(json) {
  const deserial = GraphSerializer.jsonToGraph(json)
  return {
    graph: deserial.graph,
    cost: deserial.variables.cost,
    input: deserial.placeholders.input,
    output: deserial.variables.output,
    label: deserial.placeholders.label,
  }
}

async function app() {
  const net = createNetwork()
  await trainNetwork(net,100)
  const result = await runNetwork(net,[0.1,0.2,0.3]).val(0)
  const serial = GraphSerializer.graphToJson(net.graph)
  console.log({result})
  console.log(DeepLearn.version)
  serial.push({type:'EluNode', inputs:{x:{id:1}}, output:{id:13}})
  const s2 = GraphSerializer.graphToJson(GraphSerializer.jsonToGraph(serial).graph)
  console.log('hi')
}

app()
