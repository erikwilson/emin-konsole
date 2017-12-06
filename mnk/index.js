const Game = require('./game')
const RandomPlayer = require('./players/random')
const DeepLearnPlayer = require('./players/deeplearn')
const HumanPlayer  = require('./players/human')
const BrutePlayer  = require('./players/brute')

const m = 3
const n = 3
const k = 3

const PlayerTypes = {
  random: new RandomPlayer(),
  human: new HumanPlayer(),
  brute: new BrutePlayer({m,n,k}),
}

const dlps = new Array(2).fill(0)
for (let i in dlps) {
  dlps[i] = new DeepLearnPlayer()
  PlayerTypes[`dlp${i}`] = dlps[i]
}
const players = [ PlayerTypes.brute, PlayerTypes.brute ]

const game = new Game({m,n,k,players})
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
//
    game.reset()
    setTimeout(() => game.play(async (results) => {
      let { winner } = results
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
//   const DeepLearn = require('./mnk/players/deeplearn')
//   const p = new DeepLearn()
//   p.train([[0,0,0,1,0,0,0,0,0]],[[0,0,0,1,0,0,0,0,0]])
//   const r = await p.run([0,0,0,1,0,0,0,0,0]).getValues()
//   console.log(r)
// })()

const context = { play, players, PlayerTypes }

module.exports = context

// if (module && module.exports) {
//   module.exports = replay
// } else {
//   replay()
// }
