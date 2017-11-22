/*
The MIT License

Copyright (c) 2017 Erik Wilson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

const DeepLearn = require('deeplearn')
const GraphSerializer = require('./graph-serializer')
const _ = require('lodash')

const { Scalar, Array1D, Array2D, Array3D, Array4D } = DeepLearn
const { InCPUMemoryShuffledInputProviderBuilder } = DeepLearn
const { CostReduction, FeedEntry, SGDOptimizer } = DeepLearn
const { Graph, Session, NDArrayMathGPU } = DeepLearn

function checkReserialze(g) {
  const serial = GraphSerializer.graphToJson(g)
  const clone = GraphSerializer.jsonToGraph(serial)
  const newSerial = GraphSerializer.graphToJson(clone.graph)
  const equal = _.isEqual(serial, newSerial)
  console.log('  graph reserializable', equal)
  if (!equal) {
    console.log('  failed:')
    for (let i in serial) {
      if (!_.isEqual(serial[i], newSerial[i])) {
        console.log('  ', i, serial[i], newSerial[i])
      }
    }
  }
}

function createAllGraph() {
  const g = new Graph()

  const t1_s = Scalar.new([1])
  const t2_s = Scalar.new([2])
  const t1_1d = Array1D.new([1, 2, 3, 4])
  const t2_1d = Array1D.new([5, 6, 7, 8])
  const t1_2d = Array2D.new([2, 2], [1, 2, 3, 4])
  const t2_2d = Array2D.new([2, 2], [5, 6, 7, 8])
  const t1_3d = Array3D.new([2, 2, 1], [1, 2, 3, 4])
  const t2_3d = Array3D.new([2, 2, 1], [5, 6, 7, 8])
  const t1_4d = Array4D.new([2, 2, 1, 1], [1, 2, 3, 4])
  const t2_4d = Array4D.new([2, 2, 1, 1], [5, 6, 7, 8])

  g.add( t1_3d, t2_3d )
  g.argmax( t2_4d )
  g.argmaxEquals( t1_3d, t2_3d )
  g.concat3d( t1_3d, t2_3d, 2 )
  g.constant( t1_1d )
  g.conv2d( t1_3d, t1_4d, t2_1d, 1, 1, 1, 0 )
  g.divide( t1_4d, t2_4d )
  g.exp( t1_3d )
  g.fusedLinearCombination( t1_4d, t2_4d, t1_s, t2_s )
  g.log( t1_3d )
  g.matmul( t1_2d, t2_2d )
  g.maxPool( t1_3d, 1, 1 )
  g.multiply( t1_3d, t2_3d )
  g.placeholder('test', [1,2])
  g.reduceSum( t1_4d )
  g.relu( t1_3d )
  g.reshape( t2_4d, [4] )
  g.sigmoid( t1_3d )
  g.softmax( t2_1d )
  g.softmaxCrossEntropyCost( t1_3d, t2_3d )
  g.square( t2_4d )
  g.subtract( t1_3d, t2_3d )
  g.tanh( t1_3d )
  g.variable('some', t2_4d)

  return g
}

function createTrainingGraph(math) {
  const graph = new Graph()
  const input = graph.placeholder('input', [3])
  const label = graph.placeholder('label', [1])
  let fullyConnectedLayer = graph.layers.dense(`layerIn`, input, 3)
  // fullyConnectedLayer = graph.layers.dense(`layerHidden1`, fullyConnectedLayer, 3)
  const output = graph.layers.dense(`layerOut`, fullyConnectedLayer, 1)
  graph.variable('output', output)
  const cost = graph.meanSquaredCost(label, output)
  graph.variable('cost', cost)
  return { graph, cost, input, output, label, math }
}

async function train({ graph, cost, input, label, math }, rounds=1) {
  const learningRate = .000001
  const batchSize = 3
  const session = new Session(graph, math)
  const optimizer = new SGDOptimizer(learningRate)

  const inputs = [
    Array1D.new([1.0, 2.0, 3.0]), Array1D.new([10.0, 20.0, 30.0]),
    Array1D.new([100.0, 200.0, 300.0])
  ]

  const labels =
      [Array1D.new([4.0]), Array1D.new([40.0]), Array1D.new([400.0])]

  const shuffledInputProviderBuilder =
      new InCPUMemoryShuffledInputProviderBuilder([inputs, labels])
  const [inputProvider, labelProvider] =
      shuffledInputProviderBuilder.getInputProviders()

  const feedEntries = [
    {tensor: input, data: inputProvider},
    {tensor: label, data: labelProvider}
  ]

  var done = false
  var lastCostVal = undefined
  var i = 0

  for (let i=0; i<rounds; i++) {
    await math.scope(async () => {
      const costVal = await session.train(cost, feedEntries, batchSize, optimizer, CostReduction.MEAN).val()
      // console.log(`last average cost (${i++}): ${costVal}`)
    });
  }
}

function runNetwork({ graph, input, output, math }, values) {
  const session = new Session(graph, math);
  const data = Array1D.new(values);
  const feedEntries = [{tensor: input, data}]
  return session.eval(output, feedEntries)
}

async function test() {
  console.log('checking all nodes serialization:')
  const gAll = createAllGraph()
  checkReserialze(gAll)
  const math = new NDArrayMathGPU()
  const trainer = createTrainingGraph(math)
  const trainerSerial = GraphSerializer.graphToJson(trainer.graph)
  await train(trainer)
  const val = await runNetwork(trainer,[.1,.2,.3]).val(0)

  const trainerClone = GraphSerializer.jsonToGraph(trainerSerial)
  const newTrainer = {
    graph: trainerClone.graph,
    cost: trainerClone.variables.cost,
    input: trainerClone.placeholders.input,
    output: trainerClone.variables.output,
    label: trainerClone.placeholders.label,
    math,
  }
  await train(newTrainer)
  const newVal = await runNetwork(newTrainer,[.1,.2,.3]).val(0)
  const firstDiff = val-newVal
  console.log('first training diff', firstDiff, Math.abs(firstDiff)<0.0000001?'good':'bad')

  console.log('training original for 99 rounds')
  let startTime = Date.now()
  await train(trainer,99)
  let finishTime = Date.now()
  let originalDiffTime = finishTime - startTime
  console.log(originalDiffTime, 'ms')

  console.log('training clone for 99 rounds')
  startTime = Date.now()
  await train(newTrainer,99)
  finishTime = Date.now()
  let newDiffTime = finishTime - startTime
  let timeDiff = newDiffTime-originalDiffTime
  console.log(newDiffTime, 'ms')
  console.log('time diff',timeDiff,'ms', timeDiff<1000 ? 'good' : 'bad')

  const lastVal = await runNetwork(trainer,[.1,.2,.3]).val(0)
  const lastNewVal = await runNetwork(newTrainer,[.1,.2,.3]).val(0)
  const lastDiff = lastNewVal-lastVal
  console.log('trainer diff',lastDiff, Math.abs(lastDiff)<0.0000001 ? 'good' : 'bad')

  const valDiff = .4 - lastNewVal
  console.log('expected value diff (.4)', valDiff, Math.abs(valDiff)<0.1 ? 'good' : 'bad')

  console.log('cloning trained clone')
  const trainerSerial2 = GraphSerializer.graphToJson(newTrainer.graph)
  const trainerClone2 = GraphSerializer.jsonToGraph(trainerSerial2)
  const trainedClone = {
    graph: trainerClone2.graph,
    cost: trainerClone2.variables.cost,
    input: trainerClone2.placeholders.input,
    output: trainerClone2.variables.output,
    label: trainerClone2.placeholders.label,
    math,
  }

  const lastNewClonedVal = await runNetwork(trainedClone,[.1,.2,.3]).val(0)
  const trainedDiff = lastNewClonedVal - lastNewVal
  console.log('clone trained difference',trainedDiff,Math.abs(trainedDiff)<0.0000001?'good':'bad')
  console.log('stringified network length:',JSON.stringify(trainerSerial2).length)
}

test()
