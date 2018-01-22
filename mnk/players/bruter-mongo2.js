const MongoClient = require('mongodb').MongoClient
const ScoreKeeper = require('../score-keeper')
const util = new (require('../util'))()
const LruCache = require('lru-cache')

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
    this.asyncMax = 5e4
    this.dbCache = []
    this.dbCacheFlush = []
    this.dbFlushDelta = 0.9
    this.dbDeleteBottom = 0.2
    this.flushing = false
    this.dbCount = 0
    this.dbCountMax = 1e6
    this.lruCache = new LruCache({max:this.asyncMax,stale:true})
    this.dbAsk = 0
    this.foundSolution = false

    const board = new Array(m).fill(0).map(()=>new Array(n).fill(0))
    const url = 'mongodb://localhost:27017'
    const dbName = `mnk:${m}x${n}x${k}`
    let client = await MongoClient.connect(url)
    const db = client.db(dbName)
    this.collection = db.collection('brute')
    this.count = await this.collection.count()
    try {
      this.minKey = (await this.collection.find().sort({_id:1}).limit(1).toArray())[0]._id
      this.maxKey = (await this.collection.find().sort({_id:-1}).limit(1).toArray())[0]._id
    } catch(error) {}
    console.error(`starting with ${this.count} entries, min: ${this.minKey}, max: ${this.maxKey}`)
    // const dbTimer = setInterval(this.flushCache.bind(this),1000*60*1)
    await this.computeTurns(board)
    // clearInterval(dbTimer)
    await this.flushPromise
    this.dbDeleteBottom = 0
    this.dbFlushDelta = 0
    await this.flushCache()

    this.count = await this.collection.count()
    console.error(`bruter-mongo created ${this.count} turns in ${util.getTimeStr(Date.now()-startTime)}`)
    client.close()
  }

  promiseTurns( board, turn, pos, key ) {
    // {
    //   const previous = ((turn-1) % 2) + 1
    //   const [ x, y ] = aPos
    //   aBoard = aBoard.map((r,i) => x===i ? r.slice() : r )
    //   aBoard[x][y] = previous
    // }
    //
    // const {pos,key,board} = util.getMinPosKeyBoard(aPos,aBoard)

    {
      const p = this.promises[key]
      if (p !== undefined) return p
    }{
      const q = this.dbCache[key]
      if (q !== undefined) return (async()=>q)()
    }{
      const q = this.dbCacheFlush[key]
      if (q !== undefined) return (async()=>q)()
    }{
      const q = this.lruCache.get(key)
      if (q !== undefined) return (async()=>q)()
    }

    return this.promises[key] = this.computeTurns( board, turn, pos, key ).then((q)=>{
      delete this.promises[key]
      return q
    })
  }

  async computeTurns( board, turn=0, pos, key=0 ) {
    if (this.minKey <= key && key <= this.maxKey) {
    // {
      this.dbAsk++
      const {s:state} = await util.getStateFromCollectionBatched(this.collection, key)
      if (state) {
        this.lruCache.set(key,state.q)
        return state.q
      }
    }

    let q = 2

    this.calls += 1
    if (this.dbCount>=this.dbCountMax) await this.flushCache()

    const {m, n, k} = this
    const previous = ((turn-1) % 2) + 1
    const [ x, y ] = pos || []

    let done = false

    if (pos && Math.ceil(turn/2) >= k ) {
      const won = ScoreKeeper.isWin(k,board,x,y,previous)
      if (won) {
        done = true
      } else if (turn === m*n) {
        q = 1
        done = true
      }
    }
    if (done) {
      this.dbCount++
      this.dbCache[key] = q
      return q
    }

    let openMoves = []

    for (let x=0; x<m; x++) {
      for (let y=0; y<n; y++) {
        if (board[x][y] !== 0) continue
        const next = (turn % 2) + 1
        const aBoard = board.map((r,i) => x===i ? r.slice() : r )
        aBoard[x][y] = next
        openMoves.push(util.getMinPosKeyBoard([x,y],aBoard))
      }
    }

    const average = openMoves.reduce((a,v)=>{
      console.log(a,v,openMoves.length)
      return a+v.key/openMoves.length
    },0)
    // solve higher numbered things first
    openMoves = openMoves.sort((a,b)=>Math.abs(average-a.key)>Math.abs(average-b.key))

    console.log(average,{openMoves})

    let turns = []
    for (let move of openMoves) {
      let nextq = this.promiseTurns(move.board, turn+1, move.pos, move.key)
      if (this.asyncCount >= this.asyncMax) {
        nextq = await nextq
      } else {
        this.asyncCount++
        nextq = nextq.then((q)=>{
          this.asyncCount--
          return q
        })
      }

      turns.push(nextq)
    }

    turns = await Promise.all(turns)
    q = turns.reduce((a,q)=>(2-q<a ? 2-q : a), q)
    this.dbCount++
    this.dbCache[key] = q
    return q
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

  flushCache() {
    if (this.flushing) {
      return this.flushPromise
    }

    if (!this.dbCount) {
      console.error('no database items to flush!')
      return
    }

    const flushAmount = Math.floor(this.dbCount * this.dbFlushDelta)
    const deleteBottom = Math.floor(this.dbCount * this.dbDeleteBottom)
    let flushCount = 0
    let deleteCount = 0
    this.dbCountFlush = 0
    for (let k in this.dbCache) {
      // if (flushCount < deleteBottom) {
      //   deleteCount++
      //   delete this.dbCache[k]
      // }
      if (flushCount++ <= flushAmount) continue
      this.dbCountFlush++
      this.dbCacheFlush[k] = this.dbCache[k]
      delete this.dbCache[k]
    }
    this.count += this.dbCountFlush

    {
      const now = Date.now()
      const stateStr = `states=${this.count} (+${this.dbCountFlush})`
      const callStr = `calls=${this.calls}`
      const asyncStr = `async=${this.asyncCount}`
      const dbAsk = `dbAsk=${this.dbAsk}`
      const promiseStr = `promises=${Object.keys(this.promises).length}`
      const timeStr = `+${util.getTimeStr(now-this.last)} total ${util.getTimeStr(now-this.start)}`
      console.error(`${stateStr}: ${callStr}, ${asyncStr}, ${promiseStr}, ${dbAsk} |${timeStr}|`)
      this.last = now
    }
    console.log(`deleted ${deleteCount}`)
    // this.dbCacheFlush = this.dbCache
    // this.dbCountFlush = this.dbCount
    // this.dbCache = []
    this.dbCount -= this.dbCountFlush - deleteCount
    this.dbAsk = 0
    this.flushing = true

    return this.flushPromise = (async () =>{
      if (this.minKey === undefined) this.minKey = Number.MAX_SAFE_INTEGER
      if (this.maxKey === undefined) this.maxKey = Number.MIN_SAFE_INTEGER
      let values = Object.entries(this.dbCacheFlush).map(([k,q])=>{
        k = Number.parseInt(k)
        if (k < this.minKey) this.minKey = k
        if (k > this.maxKey) this.maxKey = k
        return {_id:k,q}
      })

      if (!values.length) return

      let exitOnFinish = false
      let catchSigint = () => {
          console.log('Caught interrupt signal, waiting for write to finish')
          exitOnFinish = true
      }

      process.on('SIGINT', catchSigint)

      let result = await this.collection.insertMany(values,{w:0}).then((r)=> {
        const now = Date.now()
        console.error('`- done saving',this.dbCountFlush,`in ${util.getTimeStr(now-this.last)}`,this.minKey,this.maxKey)
        if (!this.flushing) {
          console.error('flushCache should be flagged flushing but isnt!')
        }

        process.removeListener('SIGINT', catchSigint)
        if (exitOnFinish) process.exit(1)

        this.dbCacheFlush = []
        this.dbCountFlush = 0
        this.flushing = false
        return r
      }).catch((error)=> {
        console.error(error)
        console.error('error flushing database output! reset cache')
        this.dbCache = this.dbCache.concat(this.dbCacheFlush)
        this.dbCount += this.dbCountFlush
        this.count -= this.dbCountFlush
        this.dbCacheFlush = []
        this.dbCountFlush = 0
        this.flushing = false
        return error
      })
      return result
    })()
  }
}

module.exports = BruterPlayer
