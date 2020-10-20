export default class Util {

  constructor() {
    this.batchIn = []
    this.batchInResolve = {}
    this.batchInReject = {}
    this.batchInRemains = {}
  }

  getState(states, board) {
    const m = board.length
    const n = board[0].length
    let firstK

    for (let i=0; i<4; i++) {
      if (board.length === m) {
        const k = this.getBoardKey(board)
        const s = states[k]
        if (s) return {s,i,k}
        if (i===0) firstK = k
      }
      if (board.length === n) {
        const k = this.getBoardKey(this.invertArray(board))
        const s = states[k]
        if (s) return {s,i:i+4,k}
      }
      board = this.rotateArrayRight(board)
    }

    return {k:firstK}
  }

  async getStateFromCollection(collection, keys) {
    let s = await collection.findOne({ '_id': { '$in': keys } })
    if (!s) return {k:keys[0]}
    let k = s._id
    let i = keys.indexOf(k)
    return {s,i,k}
  }

  getStateFromCollectionBatched(collection, key) {
    const {batchIn,batchInResolve,batchInReject,batchInRemains} = this
    const promise = new Promise((resolve, reject) => {
      batchIn.push(key)
      batchInRemains[key] = () => {
        return resolve({})
      }
      batchInResolve[key] = (s) => {
        delete batchInRemains[key]
        return resolve({s})
      }
      batchInReject[key] = reject
    })
    if (!this.batchInTimer) {
      this.batchInTimer = setTimeout(this.purgeBatchIn.bind(this,collection),0)
    }
    return promise
  }

  async purgeBatchIn(collection) {
    const {batchIn,batchInResolve,batchInReject,batchInRemains} = this
    this.batchInTimer = undefined
    this.batchIn = []
    this.batchInResolve = {}
    this.batchInReject = {}
    this.batchInRemains = {}
    // console.log('purgeBatchIn',batchIn.length)
    if (!batchIn.length) return
    let states = undefined
    try {
      states = await collection.find({ '_id': { '$in': batchIn } }).toArray()
    } catch(error) {
      for (let i in batchInReject) batchInReject[i](error)
      return
    }
    for (let s of states) {
      if (batchInResolve[s._id]) batchInResolve[s._id](s)
      else console.error('unable to find resolve for batch in key',s._id)
    }
    for (let i in batchInRemains) batchInRemains[i]()
  }

  getKeys(board) {
    const m = board.length
    const n = board[0].length
    const keys = []
    for (let i=0; i<4; i++) {
      if (board.length === m) {
        const k = this.getBoardKey(board)
        if (!keys.includes(k)) keys[i] = k
      }
      if (board.length === n) {
        const k = this.getBoardKey(this.invertArray(board))
        if (!keys.includes(k)) keys[i+4] = k
      }
      if (i !== 3) board = this.rotateArrayRight(board)
    }
    return keys
  }

  getMinPosKeyBoard(pos, board) {
    const M = board.length
    const N = board[0].length
    let [m,n] = [M,N]
    let [x,y] = pos || []
    let r = { key: Number.MAX_SAFE_INTEGER }
    for (let i=0; i<4; i++) {
      if (board.length === M) {
        const key = this.getBoardKey(board)
        if (key<r.key) r = {pos:[x,y],key,board}
      }
      if (board.length === N) {
        const boardInvert = this.invertArray(board)
        const key = this.getBoardKey(boardInvert)
        if (key<r.key) r = {pos:[y,x],key,board:boardInvert}
      }
      if (i !== 3) {
        [x, y] = [y, m-x-1]; [m, n] = [n, m]
        board = this.rotateArrayRight(board)
      }
    }
    return r
  }


  getMaxPosKeyBoard(pos, board) {
    const M = board.length
    const N = board[0].length
    let [m,n] = [M,N]
    let [x,y] = pos || []
    let r = { key: Number.MIN_SAFE_INTEGER }
    for (let i=0; i<4; i++) {
      if (board.length === M) {
        const key = this.getBoardKey(board)
        if (key>r.key) r = {pos:[x,y],key,board}
      }
      if (board.length === N) {
        const boardInvert = this.invertArray(board)
        const key = this.getBoardKey(boardInvert)
        if (key>r.key) r = {pos:[y,x],key,board:boardInvert}
      }
      if (i !== 3) {
        [x, y] = [y, m-x-1]; [m, n] = [n, m]
        board = this.rotateArrayRight(board)
      }
    }
    return r
  }

  getRotatedPos(pos, boardIndex, m, n) {
    let [x, y] = pos
    if (boardIndex >= 4) {
      [x, y] = [y, x]; [m, n] = [n, m]
      boardIndex -= 4
    }

    if (boardIndex>0){
      for (let i=0; i<(4-boardIndex); i++) {
        [x, y] = [y, m-x-1]; [m, n] = [n, m]
      }
    }
    return [x, y]
  }

  getBucketState(states, board) {
    const m = board.length
    const n = board[0].length
    const bucketSize = states.length
    let firstK

    for (let i=0; i<4; i++) {
      if (board.length === m) {
        const k = this.getBoardKey(board)
        const b = k % bucketSize
        const s = states[b][k]
        if (s) return {s,i,k,b}
        if (i===0) firstK = k
      }
      if (board.length === n) {
        const k = this.getBoardKey(this.invertArray(board))
        const b = k % bucketSize
        const s = states[b][k]
        if (s) return {s,i:i+4,k,b}
      }
      board = this.rotateArrayRight(board)
    }

    return {k:firstK,b:firstK%bucketSize}
  }

  getRandomInt(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min
  }

  getBoardKey(board) {
    const s = board.map((x)=>x.join('')).join('')
    // MSI = Number.MAX_SAFE_INTEGER :{ == 9007199254740991 }
    // MSI - (3**33) > 0 :{ == true }
    // MSI - (3**34) < 0 :{ == true }
    if (s.length > 33) throw new Error('board too large for accurate key: ' + s)
    const r = Number.parseInt(s,3)
    return r
  }

  getKeyBoard(key,m,n) {
    if ((m*n) > 33) throw new Error('board too large for accurate key:' + key)
    let s = key.toString(3).padStart(m*n, '0')
    const re = new RegExp(`.{${n},${n}}`, 'g')
    const r = s.match(re).map((r)=>r.split('').reverse().map((x)=>Number.parseInt(x))).reverse()
    return r
  }

  invertArray(array) {
    const m = array.length
    const n = array[0].length
    let newArray = new Array(n)
    for (let j=0; j<n; j++) {
      newArray[j] = new Array(m)
      for (let i=0; i<m; i++) {
        newArray[j][i] = array[i][j]
      }
    }
    return newArray
  }

  rotateArrayRight(array) {
    const m = array.length
    const n = array[0].length
    let newArray = new Array(n)
    for(let j=0; j<n; j++) {
      newArray[j] = new Array(m)
      for(let i=0; i<m; i++) {
        newArray[j][m-i-1]=array[i][j]
      }
    }
    return newArray
  }

  xyToPos(x,y,n) {
    return (x*n)+y
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
}
