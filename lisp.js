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
  if (input[0] === '(') {
    input = input.slice(1)
    let arr = []
    input = trimSpaces(input)
    // saving the operator in currentOpertor variable
    let currentOperator = operators[input[0]]
    if (currentOperator) {
      input = input.slice(1)
      input = trimSpaces(input)
      // extracting numbers and pushing it to arr
      while (input[0] !== ')') {
        let numOutPut = numberParser(input)
        arr.push(numOutPut[0])
        input = input.slice(1)
        input = trimSpaces(input)
      }
      if (input[0] === ')') {
        input = input.slice(1)
      }
      return [currentOperator(arr), input]
    }
  }
  return null
}

// console.log(expressionParser('(+ 1 1)'))
// console.log(expressionParser('(+ 1 2 3)'))
// console.log(expressionParser('(- 1 1)'))
// console.log(expressionParser('(* 2 2 2)'))
// console.log(expressionParser('(/ 8 4)'))
// console.log(expressionParser('(+ 8 1 0 9 0)'))
// console.log(expressionParser('(+ 2 3 5)'))
// console.log(expressionParser('(- 4 3 1)'))
// console.log(expressionParser('(* 2 3 2)'))
// console.log(expressionParser('(/ 4 2 2)'))
// console.log(expressionParser('(1 2)'))
