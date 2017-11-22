

const {Array1D, Array2D, Array3D, Array4D, CostReduction, FeedEntry, Graph, InCPUMemoryShuffledInputProviderBuilder, NDArrayMathGPU, Scalar, Session, SGDOptimizer} = require('deeplearn')
const GraphSerializer = require('./helpers/graph-serializer-test')
const _ = require('lodash')

return

function createFullyConnectedLayer(graph, inputLayer, layerIndex, sizeOfThisLayer) {
  return graph.layers.dense(`fully_connected_${layerIndex}`, inputLayer, sizeOfThisLayer);
}

// This file parallels (some of) the code in the introduction tutorial.
/**
 * 'NDArrayMathGPU' section of tutorial
 */
async function app() {
  {
    const math = new NDArrayMathGPU();

    const a = Array2D.new([2, 2], [1.0, 2.0, 3.0, 4.0]);
    const b = Array2D.new([2, 2], [0.0, 2.0, 4.0, 6.0]);

    // Non-blocking math calls.
    const diff = math.sub(a, b);
    const squaredDiff = math.elementWiseMul(diff, diff);
    const sum = math.sum(squaredDiff);
    const size = Scalar.new(a.size);
    const average = math.divide(sum, size);

    console.log(`mean squared difference: ${await average.val()}`);
  }

  {
    /**
     * 'Graphs and Tensors' section of tutorial
     */

    const g = new Graph();

    // Placeholders are input containers. This is the container for where we
    // will feed an input NDArray when we execute the graph.
    const inputShape = [3];
    const inputTensor = g.placeholder('input', inputShape);

    const labelShape = [1];
    const labelTensor = g.placeholder('label', labelShape);

    // Variables are containers that hold a value that can be updated from
    // training.
    // Here we initialize the multiplier variable randomly.
    // const multiplier = g.variable('multiplier', Array2D.randNormal([1, 3]));
    //
    // Top level graph methods take Tensors and return Tensors.
    // const outputTensor = g.matmul(multiplier, inputTensor);

    let fullyConnectedLayer =
      createFullyConnectedLayer(g, inputTensor, 0, 3);
    // fullyConnectedLayer =
    //   createFullyConnectedLayer(g, fullyConnectedLayer, 1, 128)
    // fullyConnectedLayer =
    //   createFullyConnectedLayer(g, fullyConnectedLayer, 2, 128)
    const outputTensor =
      createFullyConnectedLayer(g, fullyConnectedLayer, 3, 1)

    const costTensor = g.meanSquaredCost(labelTensor, outputTensor);
    const r1 = g.argmax(costTensor)
    const r2 = g.argmaxEquals(r1,labelTensor)
    const d3 = g.placeholder('3d', [2,2,3])
    const d32 = g.concat3d(d3,d3,2)
    const c = g.constant([1,2,3,4])
    const d2 = g.placeholder('2d', [2,2])
    const x = g.placeholder('x',[3])

    const inputDepth = 1
    const inputShape2 = [2, 2, inputDepth]
    const outputDepth = 1
    const fSize = 1
    const pad = 0
    const stride = 1

    const x1 = Array3D.new(inputShape2, [1, 2, 3, 4])
    const w1 = Array4D.new([fSize, fSize, inputDepth, outputDepth], [2])
    const bias1 = Array1D.new([-1])

    const conv2d = g.conv2d(x1, w1, bias1, stride, pad)
    g.divide(labelTensor,labelTensor)
    g.exp(labelTensor)
    g.fusedLinearCombination(x1,x1,costTensor,costTensor)
    g.log(x1)
    g.maxPool(x1, 1, 1)
    g.multiply(x1, x1)
    g.reduceSum(x1)
    g.relu(x1)
    const r3 = g.reshape(x1,[4])
    g.sigmoid(x1)
    g.softmax(r3)
    g.softmaxCrossEntropyCost(x1,x1)
    g.square(x1)
    g.subtract(x1,x1)
    g.tanh(x1)
    // Tensors, like NDArrays, have a shape attribute.
    console.log(outputTensor.shape)
    console.log('graph',g.getNodes()[2].data.getValues())

    /**
     * 'Session and FeedEntry' section of the tutorial.
     */

    const learningRate = .000001;
    const batchSize = 3;
    const math = new NDArrayMathGPU();

    const session = new Session(g, math);
    const optimizer = new SGDOptimizer(learningRate);

    const inputs = [
      Array1D.new([1.0, 2.0, 3.0]), Array1D.new([10.0, 20.0, 30.0]),
      Array1D.new([100.0, 200.0, 300.0])
    ];

    const labels =
        [Array1D.new([4.0]), Array1D.new([40.0]), Array1D.new([400.0])];

    // Shuffles inputs and labels and keeps them mutually in sync.
    const shuffledInputProviderBuilder =
        new InCPUMemoryShuffledInputProviderBuilder([inputs, labels]);
    const [inputProvider, labelProvider] =
        shuffledInputProviderBuilder.getInputProviders();

    // Maps tensors to InputProviders.
    const feedEntries = [
      {tensor: inputTensor, data: inputProvider},
      {tensor: labelTensor, data: labelProvider}
    ];

    var done = false
    var lastCostVal = undefined
    var i = 0

    while (!done) {
      // Wrap session.train in a scope so the cost gets cleaned up
      // automatically.
      await math.scope(async () => {
        // Train takes a cost tensor to minimize. Trains one batch. Returns the
        // average cost as a Scalar.
        const cost = session.train(
            costTensor, feedEntries, batchSize, optimizer, CostReduction.MEAN);

        const costVal = await cost.val()
        // done = lastCostVal == costVal
        done = i > 10
        lastCostVal = costVal
        console.log(`last average cost (${i++}): ${costVal}`);
      });
    }

    const testInput = Array1D.new([.1,.2,.3]);

    // session.eval can take NDArrays as input data.
    const testFeedEntries =
        [{tensor: inputTensor, data: testInput}];

    const testOutput = session.eval(outputTensor, testFeedEntries);

    console.log('---inference output---');
    console.log(`shape: ${testOutput.shape}`);
    console.log(`value: ${await testOutput.val(0)}`);
    console.log('nodes:', g.getNodes())
    const serial = GraphSerializer.graphToJson(g)
    console.log('serializer:',serial)
    const gData = GraphSerializer.jsonToGraph(serial)
    const {graph:newG, placeholders, variables, tensors} = gData
    console.log('newG nodes:', newG.getNodes())
    console.log(gData)
    const newSerial = GraphSerializer.graphToJson(newG, true)
    console.log('super serial:', _.isEqual(serial,newSerial))
    for (let i in newSerial) {
      const eq = _.isEqual(serial[i],newSerial[i])
      console.log(i, eq, serial[i],newSerial[i])
    }
  }
}

app();
