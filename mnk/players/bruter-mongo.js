const MongoClient = require('mongodb').MongoClient
const ScoreKeeper = require('../score-keeper')
const util = new (require('../util'))()
const Cache = require('lru-cache')

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
    this.calls = 0
    this.last = Date.now()
    this.start = this.last
    this.promises = {}
    this.asyncCount = 0
    this.asyncMax = 100
    this.cache = new Cache({max:250000})
    this.dbCache = {}

    const board = new Array(m).fill(0).map(()=>new Array(n).fill(0))
    const url = 'mongodb://localhost:27017'
    const dbName = `mnk:${m}x${n}x${k}`
    let client = await MongoClient.connect(url)
    const db = client.db(dbName)
    this.collection = db.collection('brute')
    this.count = await this.collection.count()

    const dbTimer = setInterval(this.flushDbCache.bind(this),1000*10)
    await this.computeTurns(board)
    clearInterval(dbTimer)

    const dbCacheValues = Object.values(this.dbCache)
    if (dbCacheValues.length) await this.collection.insertMany(dbCacheValues,{w:0})

    this.count = await this.collection.count()
    console.error(`bruter-mongo created ${this.count} turns in ${this.getTimeStr(Date.now()-startTime)}`)
    client.close()
  }

  promiseTurns( board, turn, pos ) {
    const { promises, cache, dbCache } = this
    const previous = ((turn-1) % 2) + 1
    const [ x, y ] = pos || []
    if (pos) {
      board = board.map((r,i) => x===i ? r.slice() : r )
      board[x][y] = previous
    }

    const keys = util.getKeys(board)
    let key = keys[0]
    let s = undefined
    for (let i in keys) {
      let k = keys[i]
      s = dbCache[k]
      if (s) return (async()=>s)()
      s = cache.get(k)
      if (s) return (async()=>s)()
      s = promises[k]
      if (s) return s
    }

    return promises[key] = this.computeTurns( board, turn, pos, keys ).then((s)=>{
      cache.set(key,s)
      promises[key] = undefined
      return s
    })
  }

  async computeTurns( board, turn=0, pos, keys=[0] ) {
    const { collection } = this

    const {s:state, k:key} = await util.getStateFromCollection(collection, keys)
    if (state) return state

    this.calls += 1
    // if ((this.calls % 1e2) === 0) await this.flushDbCache()

    const {m, n, k} = this
    const previous = ((turn-1) % 2) + 1
    const [ x, y ] = pos || []

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
      this.dbCache[key] = result
      return result
    }

    const openMoves = []
    for (let x=m-1; x>=0; x--) {
      for (let y=n-1; y>=0; y--) {
        if (board[x][y] === 0) openMoves.push([x,y])
      }
    }

    if (openMoves.length>0) result.m = []
    let turns = []
    for (let pos of openMoves) {
      let next = undefined
      if (this.asyncCount < this.asyncMax) {
        this.asyncCount++
        next = this.promiseTurns(board, turn+1, pos).then((s)=>{
          this.asyncCount--
          return s
        })
      } else {
        next = await this.promiseTurns(board, turn+1, pos)
      }
      turns.push(next)
    }
    turns = await Promise.all(turns)

    for (let i in openMoves) {
      const pos = openMoves[i]
      const next = turns[i]
      const thisScore = 2-next.s
      if (thisScore<result.s) result.s = thisScore
      result.m.push({ s:next.s, p:pos })
    }

    this.dbCache[key] = result
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

  getTimeStr(time) {
    let unit = 'ms'
    if (time>1000) {
      unit = 's'
      time /= 1000.0
    }
    if (time>60 && unit==='s') {
      unit = 'm'
      time /= 60.0
    }
    if (time>60 && unit==='m') {
      unit = 'h'
      time /= 60.0
    }
    if (time>24 && unit==='h') {
      unit = 'd'
      time /= 24.0
    }
    return `${ unit==='ms' ? time : time.toFixed(3) }${unit}`
  }

  flushDbCache() {
    const dbCacheValues = Object.values(this.dbCache).map((s)=>{
      this.cache.set(s._id,s)
      return s
    })
    this.dbCache = {}
    this.count += dbCacheValues.length
    const now = Date.now()
    const stateStr = `states=${this.count} (+${dbCacheValues.length})`
    const callStr = `calls=${this.calls}`
    const timeStr = `+${(now-this.last)/1.e3}s total ${this.getTimeStr(now-this.start)}`
    console.error(`computed ${stateStr} with ${callStr} in ${timeStr}`)
    this.last = now
    if (dbCacheValues.length) return this.collection.insertMany(dbCacheValues,{w:0})
  }
}

module.exports = BruterPlayer
