const { OnesInitializer, Graph } = require('deeplearn')
const { graphToJson } = require('deeplearn-graph-serializer')

const ones = new OnesInitializer()
const graph = new Graph()
const input = graph.placeholder('input', [10])
graph.layers.dense('layerIn', input, 10, null, true, ones, ones)

console.log(JSON.stringify(graphToJson(graph),null,2))
