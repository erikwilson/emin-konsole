module.exports = (board) => {
  const getIndex = (i) => {
    let index = ''
    if (i<10) index += i
    else if (i>10 && i<100 && i%10 === 0) index += i/10
    else index += '•'
    index += ' '
    return index
  }

  let display = board.reduce((a,m,i)=>{
    let mIndex = getIndex(i)
    a.push(m.reduce((r,n)=>{
      if (n===0) r += '·'
      if (n===1) r += '●'
      if (n===2) r += '◯'
      r += ' '
      return r
    },mIndex))
    if (i===board.length-1) a.push('m')
    return a
  },[
    (()=>{
      let nIndex = '  '
      for (var i=0; i<board[0].length; i++) {
        nIndex += getIndex(i)
      }
      nIndex += 'n'
      return nIndex
    })()
  ])

  return display
}
