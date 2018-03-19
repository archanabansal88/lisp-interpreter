const numberParser = input => {
  let regexNum = /^(?:-)?(?:0|\d+)(?:\.\d+)?(?:(?:e|E)(?:\+|-)?\d+)?/
  let num = input.match(regexNum)
  if (num) {
    return [parseFloat(num[0]), input.slice(num[0].length)]
  }
  return null
}

const spaceParser = input => {
  let regexSpace = /^\s+/
  let space = input.match(regexSpace)
  return space ? [space[0], input.slice(space[0].length)] : null
}

const trimSpaces = input => {
  let spaceOutput = spaceParser(input)
  if (spaceOutput) {
    input = spaceOutput[1]
  }
  return input
}

const operators = {
  '+': args => args.reduce((a, b) => a + b),
  '-': args => args.reduce((a, b) => a - b),
  '*': args => args.reduce((a, b) => a * b),
  '/': args => args.reduce((a, b) => a / b)
}

function expressionParser (input) {
  if (input[0] !== '(') {
    return null
  }

  input = input.slice(1)
  let arr = []
  input = trimSpaces(input)
  let currentOperator = operators[input[0]]
  if (!currentOperator) {
    return null
  }

  input = input.slice(1)
  input = trimSpaces(input)
  while (input[0] !== ')') {
    input = trimSpaces(input)
    /*
     * Recursively call when it encounters '('
     */
    if (input[0] === '(') {
      const result = expressionParser(input)
      arr.push(result[0])
      input = result[1]
      continue
    }
    let numOutPut = numberParser(input)
    arr.push(numOutPut[0])
    input = numOutPut[1]
    input = trimSpaces(input)
  }

  if (input[0] === ')') {
    input = input.slice(1)
  }
  return [currentOperator(arr), input]
}

// console.log(expressionParser('(+ 1 1)'))
// console.log(expressionParser('(+ 8 1 0 9 0)'))
// console.log(expressionParser('(+ 2 3 5)'))
// console.log(expressionParser('(- 4 3 1)'))
// console.log(expressionParser('(* 2 3 2)'))
// console.log(expressionParser('(/ 4 2 2)'))
// console.log(expressionParser('(1 2)'))
// console.log(expressionParser('(+ (+ 1 2) (+ 3 4) 87)'))
// console.log(expressionParser('(- (+ 1 2 9 9) (* 3 4) 87)'))
// console.log(expressionParser('(+ (* 6 9) (/ 9 4) 9)'))
