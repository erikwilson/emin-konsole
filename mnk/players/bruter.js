import fs from 'fs'
import path from 'path'
import url from 'url'
import ScoreKeeper from '../score-keeper.js'
import Util from '../util.js'
const util = new Util()
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export default class BruterPlayer {
  constructor({ m, n, k }) {
    this.startTime = Date.now()
    this.generated = `generated/bruter-states-${m}-${n}-${k}.json`
    this.m = parseInt(m)
    this.n = parseInt(n)
    this.k = parseInt(k)
    this.load()
    this.setup()
    const numStates = this.states.reduce((s,o)=>s+Object.keys(o).length,0)
    console.error(`evaluated ${numStates} turns in ${Date.now()-this.startTime} ms`)
  }

  async import() {
    const { m, n, k } = this
    try {
      this.states = await import(`./${this.generated}`)
      console.info(`loaded states from ${this.generated}`)
    } catch(e) {
      console.warn(e)
    }  
  }

  load() {
    let stateFile = path.join(__dirname, this.generated)
    if (fs.existsSync(stateFile)) {
      console.info(`loading ${this.generated}`)
      this.states = JSON.parse(fs.readFileSync(stateFile))
    }
  }

  setup() {
    if (this.states) {
      return
    }
    const { m, n, k } = this
    this.count = 0
    console.warn(`generating states for m:${m} n:${n} k:${k}`)
    this.states = new Array((m*n)+1).fill().map(()=>new Object())  
    const board = new Array(m).fill(0).map(()=>new Array(n).fill(0))
    // console.error(`ready to compute after ${Date.now()-startTime} ms`)
    this.computeTurns(board)
  }

  writeStates() {
    let stateFile = path.join(__dirname, this.generated)
    if (fs.existsSync(stateFile)) {
      return
    }
    fs.mkdirSync(path.dirname(stateFile), {recursive: true})
    console.info(`writing state file ${this.generated}`)
    fs.writeFileSync(stateFile, JSON.stringify(this.states))
  }

  computeTurns( board, turn=0, pos ) {
    this.count += 1
    if ((this.count % 1e5) === 0) {
      const now = Date.now()
      console.error('computed',this.count,`in ${(now-this.last)/1.e3}s`)
      this.last = now
      // if (global.gc) {
      //   // console.warn(process.memoryUsage())
      //   global.gc()
      // }
    }
    const { m, n, k } = this
    const previous = ((turn-1) % 2) + 1

    const [ x, y ] = pos || []
    if (pos !== undefined) {
      board = board.map((r,i) => x===i ? r.slice() : r )
      board[x][y] = previous
    }

    const {s:state, k:key} = util.getState(this.states[turn], board)
    if (state) return state

    const result = { s:k }
    this.states[turn][key] = result

    if (pos !== undefined && Math.ceil(turn/2) >= k ) {
      const won = ScoreKeeper.isWin(k,board,x,y,previous)
      if (won) {
        return result
      } else if (turn === m*n) {
        result.s = 0
        return result
      }
    }

    result.m = board.reduce((a,v,x)=>a.concat(v.reduce((a,v,y)=>{
      if (v===0) a.push([x,y])
      return a
    },[])),[]).map((pos)=> {
      const next = this.computeTurns(board, turn+1, pos)
      const thisScore = 1-next.s
      if (thisScore<result.s) result.s = thisScore
      return { s:next.s, p:pos }
    })

    return result
  }

  play(input, done) {
    const { board, turn } = input
    let {s:state, k:key, i:boardIndex} = util.getState(this.states[turn], board)
    if (!state) throw new Error('no state for key',key)
    // console.log(state)

    const selectRandom = (selection) => {
      if (!selection.length) throw new Error('no selections?')
      return selection[util.getRandomInt(0,selection.length)]
    }

    const maxScore = Math.max.apply(null,state.m.map(m=>m.s))

    let [x, y] = selectRandom(state.m.reduce((r,move)=>{
      if (move.s>=maxScore) r.push(move.p)
      return r
    },[]))
    // console.log({x,y,boardIndex})

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
    // console.log({x,y})
    return done({x,y})
  }

}
