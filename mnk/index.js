import Game from './game.js'
import HumanPlayer from './players/human.js'
import BruterPlayer from './players/bruter.js'
import RandomPlayer from './players/random.js'
// import DeepLearnPlayer from './players/deeplearn-turn.js'
// import DerpLearnPlayer from './players/derp-learn.js'
// import QLearnPlayer from './players/double-q-learn.js'

export default class MNK {
  constructor(m=3,n=3,k=3) {
    this.setup({m,n,k})
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
