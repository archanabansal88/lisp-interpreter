const source = require('./lisp.js')
const myRepl = require('repl')

myRepl.start({
  prompt: '> ',
  ignoreUndefined: true,
  'eval': function (cmd, context, filename, callback) {
    callback(null, source.lisp(cmd))
  }
})
