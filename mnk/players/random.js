class RandomPlayer {
  getRandomInt(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min
  }

  play(input, done) {
    const { board, m, n } = input
    const r = {x:-1, y:-1}
    while (!board[r.x] || board[r.x][r.y] !== 0) {
      r.x = this.getRandomInt(0,m)
      r.y = this.getRandomInt(0,n)
    }
    done(r)
  }
}

module.exports = RandomPlayer
