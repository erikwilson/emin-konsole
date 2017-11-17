module.exports = (board, rank) => {
  var display = []
  for (var i=0; i<rank; i++) {
    var row = ''
    for (var j=0; j<rank; j++) {
      if (board[i][j]===0)  row += ' '
      if (board[i][j]===1)  row += 'X'
      if (board[i][j]===-1) row += 'O'
      if (j!==rank-1) row += '|'
    }
    display.push(row)
    if (i!==rank-1) display.push('-'.repeat((rank*2)-1))
  }
  return display
}
