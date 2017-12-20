const Game = require('./game')
const RandomPlayer = require('./players/random')
const DerpLearnPlayer = require('./players/derp-learn')
const DeepLearnPlayer = require('./players/deeplearn-turn')
const HumanPlayer  = require('./players/human')
const BrutePlayer  = require('./players/brute')

class MNK {
  constructor(options={m:3,n:3,k:3}) {
    this.setup(options)
  }

  setup({m,n,k}) {
    const PlayerTypes = this.PlayerTypes = {
      random: new RandomPlayer(),
      human: new HumanPlayer(),
      brute: new BrutePlayer({m,n,k}),
      derp: new DerpLearnPlayer({m,n,k}),
    }

    const dlps = new Array(1).fill(0)
    for (let i in dlps) {
      dlps[i] = new DeepLearnPlayer({m,n,k})
      PlayerTypes[`dlp${i}`] = dlps[i]
    }

    this.stats = {}
    this.m = 3
    this.n = 3
    this.k = 3
    const players = this.players = [ PlayerTypes.derp, PlayerTypes.derp ]
    this.game = new Game({m,n,k,players})
  }

  play(count=1, done=console.log) {
    let startTime = Date.now()
    let replay = (count=1) => {
      if (count===0) {
        const finishTime = Date.now()
        const timeMs = finishTime-startTime
        this.stats.timeMs = timeMs
        done(this.stats)
        this.stats = {}
        console.log({finishTime,startTime,timeMs, match:startTime+timeMs===finishTime})
        startTime = Date.now()
        return
      }
  //
      this.game.reset()
      setTimeout(() => this.game.play(async (results) => {
        let { winner } = results
        winner = winner || 'tie'
        if (!this.stats[winner]) this.stats[winner]=1
        else this.stats[winner]++
        // console.log('winner:',winner,history)
        // for (let dlp of dlps) await dlp.learnGame(results)
        replay(count-1)
      }),0)
    }
    replay(count)
  }
}

module.exports = new MNK()
