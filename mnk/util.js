
class Util {

  getState(states, b) {
    const m = b.length
    const n = b[0].length
    let firstK

    for (let i=0; i<4; i++) {
      if (b.length === m) {
        const k = this.getBoardKey(b)
        const s = states[k]
        if (s) return {s,i,k}
        if (i===0) firstK = k
      }
      if (b.length === n) {
        const k = this.getBoardKey(this.invertArray(b))
        const s = states[k]
        if (s) return {s,i:i+4,k}
      }
      b = this.rotateArrayRight(b)
    }

    return {k:firstK}
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
    if (s.length > 33) throw new Error('board too large for accurate key')
    return Number.parseInt(s,3)
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

}

module.exports = Util
