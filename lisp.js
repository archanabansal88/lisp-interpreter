var globalObj = {}

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
  '/': args => args.reduce((a, b) => a / b),
  '>': args => args.reduce((a, b) => a > b),
  '<': args => args.reduce((a, b) => a < b),
  '>=': args => args.reduce((a, b) => a >= b),
  '<=': args => args.reduce((a, b) => a <= b),
  '=': args => args.reduce((a, b) => a === b)
}

// checking for simple and nested expression
const expressionParser = input => {
  if (input[0] !== '(') {
    return null
  }
  input = input.slice(1)
  let arr = []
  input = trimSpaces(input)
  let operator = input.slice(0, input.indexOf(' '))
  let currentOperator = operators[operator]
  if (!currentOperator) {
    return null
  }
  input = input.slice(operator.length + 1)
  input = trimSpaces(input)
  while (input[0] !== ')') {
    // Recursively call when it encounters '('
    if (input[0] === '(') {
      const result = expressionParser(input)
      arr.push(result[0])
      input = result[1]
      continue
    }
    let numOutPut = valueParser(input)
    if (globalObj.hasOwnProperty(numOutPut[0])) {
      arr.push(globalObj[numOutPut[0]])
    } else {
      arr.push(numOutPut[0])
    }
    input = numOutPut[1]
    input = trimSpaces(input)
  }

  if (input[0] === ')') {
    input = input.slice(1)
  }
  return [currentOperator(arr), input]
}

/**
 *Extract the first expression from the input
 */
const extractExpression = input => {
  let str = ''
  if (!input.startsWith('(')) {
    return null
  }
  str += input[0]
  input = input.slice(1)
  let count = 1
  while (input && count !== 0) {
    if (input[0] === '(') {
      count++
    }
    if (input[0] === ')') {
      count--
    }
    str += input[0]
    input = input.slice(1)
  }
  return [str, input]
}

/**
 *parsing the if expression
 */
const ifParser = input => {
  if (!input.startsWith('(')) {
    return null
  }
  input = input.slice(1)
  input = trimSpaces(input)
  if (!input.startsWith('if')) {
    return null
  }
  input = input.slice(2)
  input = trimSpaces(input)

  // Evaluating the condition of if expression
  let condition = expressionParser(input)
  input = condition[1]
  let result
  let ifCondition = extractExpression(trimSpaces(input))
  let elseCondition = extractExpression(trimSpaces(ifCondition[1]))

  // When there is no else block statement
  input = trimSpaces(ifCondition[1])

  if (elseCondition) {
    input = trimSpaces(elseCondition[1])
  }
  if (input[0] === ')') {
    input = input.slice(1)
  }

  // Executing true block statement
  if (condition[0] === true) {
    result = allParser(ifCondition[0])
  }
  // Executing false block statement
  else {
    if (!elseCondition) {
      return null
    }
    result = allParser(elseCondition[0])
  }
  return [result[0], input]
}

const symbolParser = input => {
  let regexSym = (/^[a-zA-Z]+/)
  let symbol = input.match(regexSym)
  if (symbol && globalObj.hasOwnProperty(symbol[0])) {
    return [globalObj[symbol[0]], input.slice(symbol[0].length)]
  } else if (symbol) {
    return [symbol[0], input.slice(symbol[0].length)]
  }
  return null
}

/*
*parsing the define expression
*/
const defineParser = input => {
  if (!input.startsWith('(')) {
    return null
  }
  input = input.slice(1)
  input = trimSpaces(input)
  if (!input.startsWith('define')) {
    return null
  }
  input = input.slice(6)
  input = trimSpaces(input)
  let result
  // checking for symbol
  let symbol = symbolParser(input)
  if (!symbol) {
    return 'Error: define: symbol or pair expected but got undefined []'
  }

  input = trimSpaces(symbol[1])
  // checking for value and saving it to globalObj
  let value = valueParser(input)
  input = trimSpaces(value[1].slice(1))
  if (value) {
    globalObj[symbol[0]] = value[0]
  } else {
    globalObj[symbol[0]] = ''
  }

  if (input) {
    result = valueParser(input)
    return [result[0], result[1]]
  }

  return [globalObj, input]
}

const factoryParser = (...parsers) => {
  return function (input) {
    for (let value of parsers) {
      let valueOutput = value(input)
      if (valueOutput) {
        return valueOutput
      }
    }
    return null
  }
}
const valueParser = factoryParser(numberParser, expressionParser, symbolParser)
const allParser = factoryParser(numberParser, expressionParser, ifParser, defineParser, symbolParser)

/**
 *parsing all parsers
*/
const parse = (input) => {
  let result
  while (input && input.startsWith('(')) {
    result = allParser(input)
    if (!result) {
      return 'Invalid'
    }
    input = trimSpaces(result[1])
  }
  return result
}

// console.log(expressionParser('(+ 8 1 0 9 0)'))
// console.log(expressionParser('(+ 2 3 5)'))
// console.log(expressionParser('(- 4 3 1)'))
// console.log(expressionParser('(* 2 3 2)'))
// console.log(expressionParser('(/ 4 2 2)'))
// console.log(expressionParser('(1 2)'))
// console.log(expressionParser('(+ (+ 1 2) (+ 3 4) 87)'))
// console.log(expressionParser('(- (+ 1 2 9 9) (* 3 4) 87)'))
// console.log(expressionParser('(+ (* 6 9) (/ 9 4) 9)'))
// console.log(parse('(+ (* 6 9) (/ 9 4) 9)'))
// console.log(parse('(if (<= 1 1) (+ 2 2) (+ 1 1))'))
// console.log(parse('(if (< 1 2) (+ 6 9) (+ 9 4))'))
// console.log(parse('(if (> 1 2) (+ 6 9) (+ 9 4))'))
// console.log(parse('(if (> 10 20) (+ 1 1) (+ 3 3)) (if (< 10 20) (+ 1 1) (+ 3 3))'))
// console.log(parse('(if (< 1 2) (if (< 2 1) (+ 1 2 3 4) (+ 3 3)))'))
// console.log(parse('(if (< 1 2) (if (< 2 1) (+ 1 1) (+ 3 3)) (+ 4 4))'))
// console.log(parse('(if (<= 1 2) (if (<= 2 2) (+ 1 1) (+ 3 3)) (+ 4 4))'))
// console.log(parse('(define r 4)'))
// console.log(parse('(define)'))
console.log(parse('(define lamda 10)'))
// console.log(parse('(define r 10) r'))
// // console.log(parse('(define k 8)(* k k)'))
// console.log(parse('(define k 8)(* r r)'))
// console.log(parse('(define k 8)(* r)'))
// console.log(parse('(define k 10)'))
