module.exports = (board, rank) => {
  var display = []
  for (var y=0; y<rank; y++) {
    var row = ''
    for (var x=0; x<rank; x++) {
      if (board[y][x]===0) row += ' '
      if (board[y][x]===1) row += 'X'
      if (board[y][x]===2) row += 'O'
      if (x!==rank-1) row += '|'
    }
    display.push(row)
    if (y!==rank-1) display.push('-'.repeat((rank*2)-1))
  }
  return display
}
