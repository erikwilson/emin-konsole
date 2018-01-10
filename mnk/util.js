class Util {

  constructor() {
    this.timeout = 0
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
}

module.exports = Util
