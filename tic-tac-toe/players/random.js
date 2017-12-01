class RandomPlayer {
  getRandomInt(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min
  }

  play(input, done) {
    const board = input.board
    const rank = input.rank

    var coords
    while (!coords) {
      var test = {
        x: this.getRandomInt(0,rank),
        y: this.getRandomInt(0,rank),
      }
      if (board[test.y][test.x]===0) coords = test
    }
    done(coords)
  }
}

module.exports = RandomPlayer
