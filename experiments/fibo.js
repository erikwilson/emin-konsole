
module.exports = (input, done, progress) => {
  progress({input,result:'pending'})
  function fibo (n) {
    return n > 1 ? fibo(n - 1) + fibo(n - 2) : 1;
  }
  var data = {input, result:fibo(input)}
  done(data)
}
