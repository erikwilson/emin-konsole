const MongoClient = require('mongodb').MongoClient
const ScoreKeeper = require('../score-keeper')
const util = new (require('../util'))()

class BruterPlayer {
  constructor({ m, n, k }) {
    this.setup({ m, n, k })
    Object.keys(this).forEach((key)=> {
      Object.defineProperty(this, key, {enumerable:false})
    })
  }

  async setup({ m, n, k }) {
    const startTime = Date.now()
    this.states = new Array((m*n)+1).fill().map(()=>new Object())
    this.m = m
    this.n = n
    this.k = k
    this.count = 0
    this.last = Date.now()
    const board = new Array(m).fill(0).map(()=>new Array(n).fill(0))
    const url = 'mongodb://localhost:27017'
    const dbName = `mnk:${m}x${n}x${k}`
    let client = await MongoClient.connect(url)
    const db = client.db(dbName)
    const collection = db.collection('brute')
    this.collection = collection
    await this.computeTurns(board)
    const cache = Object.values(util.dbCache)
    if (cache.length) await collection.insertMany(cache,{w:0})
    const count = await collection.count()
    console.error(`bruter created ${count} turns in ${Date.now()-startTime} ms`)
    client.close()
  }

  async computeTurns( board, turn=0, pos ) {
    const { collection, m, n, k } = this
    const previous = ((turn-1) % 2) + 1
    const [ x, y ] = pos || []

    this.count += 1
    if ((this.count % 1e5) === 0) {
      const now = Date.now()
      console.error('computed',this.count,`in ${(now-this.last)/1.e3}s`)
      this.last = now
      const cache = Object.values(util.dbCache)
      console.error(cache.length)
      await collection.insertMany(cache,{w:0})
      util.dbCache = []
    }

    if (pos) {
      board = board.map((r,i) => x===i ? r.slice() : r )
      board[x][y] = previous
    }

    const {s:state, k:key} = await util.getStateFromCollection(collection, board)
    if (state) return state

    const result = { _id:key, s:2 }
    let done = false

    if (pos && Math.ceil(turn/2) >= k ) {
      const won = ScoreKeeper.isWin(k,board,x,y,previous)
      if (won) {
        done = true
      } else if (turn === m*n) {
        result.s = 1
        done = true
      }
    }
    if (done) {
      util.cache.set(key, result)
      util.dbCache[key] = result
      return result
    }

    const openMoves = []
    for (let x=m-1; x>=0; x--) {
      for (let y=n-1; y>=0; y--) {
        if (board[x][y] === 0) openMoves.push([x,y])
      }
    }

    if (openMoves.length>0) result.m = []
    for (let pos of openMoves) {
      const next = await this.computeTurns(board, turn+1, pos)
      const thisScore = 2-next.s
      if (thisScore<result.s) result.s = thisScore
      result.m.push({ s:next.s, p:pos })
    }

    util.cache.set(key, result)
    util.dbCache[key] = result
    return result
  }

  play(input, done) {
    const { board, turn } = input
    let {s:state, k:key, i:boardIndex} = util.getState(this.states[turn], board)
    if (!state) throw new Error('no state for key',key)

    const selectRandom = (selection) => {
      if (!selection.length) throw new Error('no selections?')
      return selection[util.getRandomInt(0,selection.length)]
    }

    const maxScore = Math.max.apply(null,state.m.map(m=>m.s))

    let [x, y] = selectRandom(state.m.reduce((r,move)=>{
      if (move.s>=maxScore) r.push(move.p)
      return r
    },[]))

    let [m, n] = [board.length, board[0].length]
    if (boardIndex >= 4) {
      [x, y] = [y, x]; [m, n] = [n, m]
      boardIndex -= 4
    }

    if (boardIndex>0){
      for (let i=0; i<(4-boardIndex); i++) {
        [x, y] = [y, m-x-1]; [m, n] = [n, m]
      }
    }

    return done({x,y})
  }

}

module.exports = BruterPlayer
