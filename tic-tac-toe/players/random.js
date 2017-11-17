module.exports = (input, done) => {
  function getRandomInt(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min
  }

  const board = input.board
  const rank = input.rank

  var coords
  while (!coords) {
    var test = { x:getRandomInt(0,rank), y:getRandomInt(0,rank) }
    if (board[test.x][test.y]===0) coords = test
  }
  done(coords)
}
