
const CENTER = 1
const CORNER = 2
const EDGE   = 3
const OTHER  = 4

class PerfectPlayer {
  getRandomInt(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min
  }

  typeof(x, y, rank) {
    const max = rank - 1
    if (x===(max/2) && y===(max/2)) return CENTER
    if ((x===0 || x===max) && (y===0 || y===max)) return CORNER
    if (x===0 || x===max || y===0 || y===max) return EDGE
    return OTHER
  }

  play(input, done) {
    const { num, board, rank, turn, history } = input
    const max = rank - 1

    if (turn === 0) {
      const x = this.getRandomInt(0,rank)
      const y = this.getRandomInt(0,rank)
      return done({x,y})
    }
    if (turn === 1) {
      const { x, y } = history[0]
      const lastType = this.typeof(x,y,rank)
      if (lastType === CORNER) return done({x:max/2, y:max/2})
      if (lastType === CENTER) {
        const move = this.getRandomInt(0,4)
        if (move===0) return done({ x:0,   y:0   })
        if (move===1) return done({ x:max, y:0   })
        if (move===2) return done({ x:0,   y:max })
        if (move===3) return done({ x:max, y:max })
      }
      {
        const move = this.getRandomInt(0,3)
        if (move===0) {
          if (x===0 || x===max) return done({x,y:0})
          if (y===0 || y===max) return done({x:0,y})
        }
        if (move===1) {
          if (x===0 || x===max) return done({x,y:max})
          if (y===0 || y===max) return done({x:max,y})
        }
        if (move===2) {
          return done({x:max-x,y:max-y})
        }
      }
    }
    if (turn === 2) {
      const { x0, y0 } = history[0]
      const { x1, y1 } = history[1]
      const move0 = this.typeof(x0,y0,rank)
      const move1 = this.typeof(x1,y1,rank)
      if (move0===CORNER && move1===CENTER) {
        return done({x:max-x0,y:max-y0})
      }
    }
    console.log(history)

  }

}

module.exports = PerfectPlayer
