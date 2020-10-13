const Game = require('./game')
const RandomPlayer = require('./players/random')
const DerpLearnPlayer = require('./players/derp-learn')
const DeepLearnPlayer = require('./players/deeplearn-turn')
const HumanPlayer  = require('./players/human')
const QLearnPlayer  = require('./players/double-q-learn')
const BruterPlayer  = require('./players/bruter')

class MNK {
  constructor(options={m:4,n:4,k:3}) {
    this.setup(options)
    this.play(1000)
  }

  setup({m,n,k}) {
    const PlayerTypes = this.PlayerTypes = {
      random: new RandomPlayer(),
      human: new HumanPlayer(),
      bruter: new BruterPlayer({m,n,k}),
      // derp: new DerpLearnPlayer({m,n,k}),
      // q: new QLearnPlayer({m,n,k}),
    }
    this.m = m
    this.n = n
    this.k = k
    this.players = [ PlayerTypes.bruter, PlayerTypes.random ]
  }

  newGame() {
    const { m, n, k, players } = this
    return new Game({ m, n, k, players })
  }

  play(count=1, done=console.log) {
    let startTime = Date.now()
    let stats = {}
    let game = this.newGame()

    let replay = (count=1) => {
      if (count===0) {
        stats.timeMs = Date.now()-startTime
        done(stats)
        return
      }

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
    return game
  }

}

module.exports = new MNK()
