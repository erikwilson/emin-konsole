
export default class RandomPlayer {
  getRandomInt(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min
  }

  play(input, done) {
    const { board, n } = input
    const moves = [].concat(...board).reduce( (a,b,i) => {
      if (b===0) a.push(i)
      return a
    }, [])
    const move = moves[this.getRandomInt(0,moves.length)]
    const r = this.posToXy(move,n)
    done(r)
  }

  posToXy(i,n) {
    const x = Math.floor(i/n)
    const y = i-(x*n)
    return {x,y}
  }
}
