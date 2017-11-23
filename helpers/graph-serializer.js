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

const { Scalar, Graph } = require('deeplearn')

//------------------------------------------------------------------------------

function graphToJson( graph, idStartsAtZero=true ) {

  if (!graph) return
  const graphNodes = graph.getNodes()
  if (graphNodes.length <= 0) return []

  let idOffset = 0
  if (idStartsAtZero) idOffset = graphNodes[0].id

  const dataToJson = (data) => {
    const {shape, dtype} = data
    if (data.getValues) {
      const values = Array.from(data.getValues())
      return { values, shape, dtype }
    }
    return
  }

  const copyInputsOrOutput = (io) => {
    if (!io) return
    if (io.id !== undefined) return {id:(io.id-idOffset)}
    const newData = dataToJson(io)
    if (newData) return newData
    return
  }

  const jsonNodes = []
  for (let node of graphNodes) {
    const jsonNode = { type: node.constructor.name }
    if (node.data) jsonNode.data = copyInputsOrOutput(node.data)

    for (let v in node) {
      if (!(node[v] instanceof Object) && v !== 'id') jsonNode[v] = node[v]
    }

    if (Object.keys(node.inputs).length > 0) {
      jsonNode.inputs = {}
      for (let v in node.inputs) {
        jsonNode.inputs[v] = copyInputsOrOutput(node.inputs[v])
      }
    }
    jsonNode.output = copyInputsOrOutput(node.output)
    jsonNode.output.shape = node.output.shape
    jsonNodes.push(jsonNode)
  }
  return jsonNodes
}

//------------------------------------------------------------------------------

function jsonToGraph( nodes ) {

  const graph = new Graph()
  const placeholders = {}
  const variables = {}
  const tensors = {}

  for (let node of nodes) {
    const { name, type, data, dtype, inputs, output } = node

    const getTensor = (info) => {
      if (!info) throw new Error('tensor info not defined')
      const { id, dtype, shape } = info
      if (id !== undefined) return tensors[id]

      let { values } = info
      if (dtype === 'float32') values = Float32Array.from(values)
      if (dtype === 'int32') values = Int32Array.from(values)
      if (dtype === 'bool') values = Uint8Array.from(values)

      return Scalar.make( shape, {values}, dtype )
    }

    const gFunc = {
      AddNode: () => {
        const t1 = getTensor(inputs.t1)
        const t2 = getTensor(inputs.t2)
        tensors[output.id] =
          graph.add( t1, t2 )
      },
      ArgMaxNode: () => {
        const x = getTensor(inputs.x)
        tensors[output.id] =
          graph.argmax( x )
      },
      ArgMaxEqualsNode: () => {
        const x1 = getTensor(inputs.x1)
        const x2 = getTensor(inputs.x2)
        tensors[output.id] =
          graph.argmaxEquals( x1, x2 )
      },
      Concat3DNode: () => {
        const x1 = getTensor(inputs.x1)
        const x2 = getTensor(inputs.x2)
        const { axis } = node
        tensors[output.id] =
          graph.concat3d( x1, x2, axis )
      },
      ConstantNode: () => {
        const data = getTensor(node.data)
        tensors[output.id] =
          graph.constant( data )
      },
      Convolution2DNode: () => {
        const x = getTensor(inputs.x)
        const w = getTensor(inputs.w)
        const b = getTensor(inputs.b)
        const { fieldSize, outputDepth, stride, zeroPad } = node
        tensors[output.id] =
          graph.conv2d( x, w, b, fieldSize, outputDepth, stride, zeroPad )
      },
      DivideNode: () => {
        const t1 = getTensor(inputs.t1)
        const t2 = getTensor(inputs.t2)
        tensors[output.id] =
          graph.divide( t1, t2 )
      },
      ExpNode: () => {
        const x = getTensor(inputs.x)
        tensors[output.id] =
          graph.exp( x )
      },
      FusedLinearCombinationNode: () => {
        const t1 = getTensor(inputs.t1)
        const t2 = getTensor(inputs.t2)
        const c1 = getTensor(inputs.c1)
        const c2 = getTensor(inputs.c2)
        tensors[output.id] =
          graph.fusedLinearCombination( t1, t2, c1, c2 )
      },
      LogNode: () => {
        const x = getTensor(inputs.x)
        tensors[output.id] =
          graph.log( x )
      },
      MatMulNode: () => {
        const x1 = getTensor(inputs.x1)
        const x2 = getTensor(inputs.x2)
        tensors[output.id] =
          graph.matmul( x1, x2 )
      },
      MaxPoolNode: () => {
        const x = getTensor(inputs.x)
        const { fieldSize, stride, zeroPad } = node
        tensors[output.id] =
          graph.maxPool( x, fieldSize, stride, zeroPad )
      },
      MeanSquaredCostNode: () => {
        const label = getTensor(inputs.label)
        const prediction = getTensor(inputs.prediction)
        tensors[output.id] =
          graph.meanSquaredCost( label, prediction )
      },
      MultiplyNode: () => {
        const t1 = getTensor(inputs.t1)
        const t2 = getTensor(inputs.t2)
        tensors[output.id] =
          graph.multiply( t1, t2 )
      },
      PlaceholderNode: () => {
        const { shape } = output
        tensors[output.id] = placeholders[name] =
          graph.placeholder( name, shape )
      },
      ReduceSumNode: () => {
        const x = getTensor(inputs.x)
        tensors[output.id] =
          graph.reduceSum( x )
      },
      ReLUNode: () => {
        const x = getTensor(inputs.x)
        tensors[output.id] =
          graph.relu( x )
      },
      ReshapeNode: () => {
        const x = getTensor(inputs.x)
        const { shape } = output
        tensors[output.id] =
          graph.reshape( x, shape )
      },
      SigmoidNode: () => {
        const x = getTensor(inputs.x)
        tensors[output.id] =
          graph.sigmoid( x )
      },
      SoftmaxNode: () => {
        const x = getTensor(inputs.x)
        tensors[output.id] =
          graph.softmax( x )
      },
      SoftmaxCrossEntropyCostNode: () => {
        const x = getTensor(inputs.x)
        const target = getTensor(inputs.target)
        tensors[output.id] =
          graph.softmaxCrossEntropyCost( x, target )
      },
      SquareNode: () => {
        const x = getTensor(inputs.x)
        tensors[output.id] =
          graph.square( x )
      },
      SubtractNode: () => {
        const t1 = getTensor(inputs.t1)
        const t2 = getTensor(inputs.t2)
        tensors[output.id] =
          graph.subtract( t1, t2 )
      },
      TanHNode: () => {
        const x = getTensor(inputs.x)
        tensors[output.id] =
          graph.tanh( x )
      },
      VariableNode: () => {
        const data = getTensor(node.data)
        variables[name] = data
        tensors[output.id] =
          graph.variable( name, data )
      },
    }

    if (gFunc[type]) gFunc[type]()
    else throw new Error(`${type} conversion does not exist`)
  }
  return {graph, placeholders, variables, tensors}
}

//------------------------------------------------------------------------------

module.exports = { graphToJson, jsonToGraph }
