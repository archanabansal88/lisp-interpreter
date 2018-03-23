const fs = require('fs')
const source = require('./lisp.js')
const file = process.argv[2]

fs.readFile(file, 'utf-8', (error, str) => {
  if (error) throw error
  console.log(source.lisp(str))
})
