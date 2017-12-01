const Game = require('./tic-tac-toe/game')
const RandomPlayer = require('./tic-tac-toe/players/random')
const DeepLearnPlayer = require('./tic-tac-toe/players/deeplearn')
const HumanPlayer  = require('./tic-tac-toe/players/human')
const PerfectPlayer  = require('./tic-tac-toe/players/perfect')

require('./app')

const PlayerTypes = {
  random: new RandomPlayer(),
  human: new HumanPlayer(),
  perfect: new PerfectPlayer(),
}

const dlps = new Array(2).fill(0)
for (let i in dlps) {
  dlps[i] = new DeepLearnPlayer()
  PlayerTypes[`dlp${i}`] = dlps[i]
}
const players = [ PlayerTypes.perfect, PlayerTypes.perfect ]

const game = new Game({rank:3,players})
let stats = {}
const play = (count=1, done=console.log) => {
  let startTime = Date.now()
  let replay = (count=1) => {
    if (count===0) {
      const finishTime = Date.now()
      const timeMs = finishTime-startTime
      stats.timeMs = timeMs
      done(stats)
      stats = {}
      console.log({finishTime,startTime,timeMs, match:startTime+timeMs===finishTime})
      startTime = Date.now()
      return
    }

    game.reset()
    setTimeout(() => game.play(async (results) => {
      let { winner, history } = results
      winner = winner || 'tie'
      if (!stats[winner]) stats[winner]=1
      else stats[winner]++
      // console.log('winner:',winner,history)
      // for (let dlp of dlps) await dlp.learnGame(results)
      replay(count-1)
    }),0)
  }
  replay(count)
}
//
// (async () => {
//   const DeepLearn = require('./tic-tac-toe/players/deeplearn')
//   const p = new DeepLearn()
//   p.train([[0,0,0,1,0,0,0,0,0]],[[0,0,0,1,0,0,0,0,0]])
//   const r = await p.run([0,0,0,1,0,0,0,0,0]).getValues()
//   console.log(r)
// })()

const context = { play, players, PlayerTypes }

try {
  const repl = require('repl');
  const replContext = repl.start('> ').context
  for (let v in context) replContext[v] = context[v]
  return
} catch (error) {}

module.exports = context

// if (module && module.exports) {
//   module.exports = replay
// } else {
//   replay()
// }
