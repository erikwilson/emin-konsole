const Game = require('./tic-tac-toe/game')
const randomPlayer = require('./tic-tac-toe/players/random')
// const humanPlayer  = require('./tic-tac-toe/players/human')

const players = [
  {
    num: 1,
    play: randomPlayer,
  },
  {
    num: -1,
    play: randomPlayer,
  },
]

const game = new Game({rank:4,players})

const replay = () => {
  game.reset()
  setTimeout(()=>game.play(replay),500)
}

module.exports = replay

// if (module && module.exports) {
//   module.exports = replay
// } else {
//   replay()
// }
