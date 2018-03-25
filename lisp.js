var globalObj = {}

const regex = {
  space: /^\s+/,
  number: /^(?:-)?(?:0|\d+)(?:\.\d+)?(?:(?:e|E)(?:\+|-)?\d+)?/,
  symbol: /^[a-zA-Z]+/,
  if: /^((\(\s*)if )/,
  define: /^((\(\s*)define )/,
  lambda: /^((\(\s*)\(?(\s*)lambda )/,
  exp: /^(\(\s*)/
}

const spaceParser = input => regexParser(input, regex.space)

const symbolParser = input => regexParser(input, regex.symbol)

const regexParser = (input, regex) => {
  const matched = input.match(regex)
  return matched ? [matched[0], input.slice(matched[0].length)] : null
}

const numberParser = input => {
  const num = regexParser(input, regex.number)
  return num ? [parseFloat(num[0]), num[1]] : null
}

const trimSpaces = input => {
  const spaceOutput = spaceParser(input)
  return spaceOutput ? spaceOutput[1] : input
}

const operators = {
  '+': args => args.reduce((a, b) => a + b),
  '-': args => args.reduce((a, b) => a - b),
  '*': args => args.reduce((a, b) => a * b),
  '/': args => args.reduce((a, b) => a / b),
  '>': args => comparator(args, '>'),
  '<': args => comparator(args, '<'),
  '>=': args => comparator(args, '>='),
  '<=': args => comparator(args, '<='),
  '=': args => comparator(args, '==='),
  'max': args => Math.max(...args),
  'min': args => Math.min(...args)
}

const comparision = {
  '>': (a, b) => a > b,
  '<': (a, b) => a < b,
  '>=': (a, b) => a >= b,
  '<=': (a, b) => a <= b,
  '=': (a, b) => a === b
}

const comparator = (arr, operator) => {
  for (let i = 0; i < arr.length - 1; i++) {
    if (!comparision[operator](arr[i], arr[i + 1])) {
      return false
    }
  }
  return true
}

/**
 * Checking for simple and nested expression
*/
const expressionParser = (input) => {
  const expr = regexParser(input, regex.exp)
  if (!expr) { return null }
  input = expr[1]
  let arr = []
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
      input = trimSpaces(result[1])
      continue
    }
    let numOutPut = valueParser(input)
    if (globalObj.hasOwnProperty(numOutPut[0])) {
      arr.push(globalObj[numOutPut[0]])
    } else {
      arr.push(numOutPut[0])
    }
    input = trimSpaces(numOutPut[1])
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
const ifParser = (input) => {
  const exp = regexParser(input, regex.if)
  if (!exp) { return null }
  input = exp[1]
  // Evaluating the condition of if expression
  let condition = valueParser(input)
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
  } else { // Executing false block statement
    if (!elseCondition) {
      throw new Error('Else Condition not defined')
    }
    result = allParser(elseCondition[0])
  }
  return [result[0], input]
}

/*
*parsing the define expression
*/
const defineParser = input => {
  const exp = regexParser(input, regex.define)
  if (!exp) { return null }
  input = exp[1]
  let value
  // checking for symbol
  let symbol = symbolParser(input)
  if (!symbol) {
    return 'Error: define: symbol or pair expected but got undefined []'
  }
  input = trimSpaces(symbol[1])

  // checking for value(either lambda or simple expression) and saving it to globalObj
  value = lambdaParser(input) || valueParser(input)
  if (value) {
    globalObj[symbol[0]] = value[0]
  } else {
    globalObj[symbol[0]] = ''
  }
  input = trimSpaces(value[1].slice(1))
  return ['', input]
}

/**
 * parsing lambda expression
*/
const lambdaParser = input => {
  let exp = regexParser(input, regex.lambda)
  if (!exp) { return null }
  input = exp[1]
  let values = []
  // Extracting the arguments of lambda expression
  let arg = getArguments(trimSpaces(input))
  input = arg[1]

  // Extracting the body of lambda expression
  let bodyExp = extractExpression(trimSpaces(input))
  input = trimSpaces(bodyExp[1])

  if (input[0] !== ')') {
    throw new Error('Invalid Lambda expression')
  }
  input = trimSpaces(input.slice('1'))

  // Extracting the values if self invoking
  if (input[0] !== ')') {
    while (input[0] !== ')') {
      const num = numberParser(input)
      values.push(num[0])
      input = trimSpaces(num[1])
    }

    if (arg[0].length !== values.length) {
      throw new Error('arguments mismatch')
    }
    const fnObj = context(bodyExp[0], arg[0], values, globalObj)
    const result = funcEvaluator(fnObj)
    return [result, input.slice(1)]
  }
  // Mapping the argument with the respective values
  const result = context(bodyExp[0], arg[0], values, globalObj)
  return [result, input]
}

/**
 * Mapping the lambda arguments with their respective values if present
 *if value not found then checking its parent for values
*/
const context = (fnBody, args, values, parent) => {
  const param = args.reduce((current, arg, index) => {
    current[arg] = values[index]
    return current
  }, {})
  const fn = {
    args,
    fnBody,
    parent,
    find: function (key) {
      if (this[key]) return this[key]
      return (this.parent.hasOwnProperty('find') && this.parent.find(key)) || this.parent[key]
    }
  }
  return Object.assign({}, param, fn)
}

/**
 * Getting arguments of Lambda expression
 */
const getArguments = input => {
  const expr = regexParser(input, regex.exp)
  if (!expr) { return null }
  input = expr[1]
  let ele
  let arg = []
  while (input[0] !== ')') {
    ele = valueParser(input)
    if (!ele) {
      return null
    }
    arg.push(ele[0])
    input = trimSpaces(ele[1])
  }
  return [arg, input.slice(1)]
}

const extractSymbol = (input) => {
  let arr = []
  while (input) {
    const symbols = symbolParser(trimSpaces(input))
    if (symbols) {
      var keyword = ['if', 'lambda', 'define', 'min', 'max']
      if (keyword.indexOf(symbols[0]) === -1) {
        arr.push(symbols[0])
      }
      input = symbols[1]
    } else {
      input = input.slice(1)
    }
  }
  return arr
}

const funcEvaluator = (obj) => {
  const symbols = extractSymbol(obj.fnBody)
  symbols.forEach((value) => {
    const argValue = obj.find(value)
    if (!argValue) {
      throw new Error(value + ' is not defined')
    }
    const regex = new RegExp(value, 'g')
    obj.fnBody = obj.fnBody.replace(regex, argValue)
  })
  const result = allParser(obj.fnBody)
  return result[0]
}

const callParser = input => {
  if (input[0] !== '(') {
    return null
  }
  const fn = getArguments(input)
  const [fnName, ...values] = fn[0]
  if (!(fnName in globalObj)) {
    return null
  }
  const obj = globalObj[fnName]
  if (obj.args.length !== values.length) {
    throw new Error('arguments mismatch')
  }
  obj.args.forEach((value, index) => {
    obj[value] = values[index]
  })
  var result = funcEvaluator(obj)
  return [result, trimSpaces(fn[1])]
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
const allParser = factoryParser(numberParser, ifParser, expressionParser, defineParser, lambdaParser, symbolParser, callParser)

/**
 *parsing all parsers
*/
const parse = (input) => {
  // try {
  let result
  while (input.length > 0 && input.startsWith('(')) {
    result = allParser(input)
    if (!result) {
      return 'Invalid'
    }
    input = trimSpaces(result[1])
  }
  if (result) {
    return result[0]
  } else {
    return ''
  }
  // } catch (e) {
  //   return e.message || 'Invalid'
  // }
}

exports.lisp = parse

// console.log(parse('(+ 8 1 0 9 0)'))
// console.log(parse('(+ 2 3 5)'))
// console.log(parse('(* 2 3 2)'))
// console.log(parse('(/ 4 2 2)'))
// console.log(parse('(1 2)'))
// console.log(parse('(+ (+ 1 2) (+ 3 4) 87)'))
// console.log(parse('(- (+ 1 2 9 9) (* 3 4) 87)'))
// console.log(parse('(+ (* 6 9) (/ 9 4) 9)'))
// console.log(parse('(min 1 8 3 4 5)'))

// console.log(parse('(if (<= 1 1) (+ 2 2) (+ 1 1))'))
// console.log(parse('(if (< 1 2) (+ 6 9) (+ 9 4))'))
// console.log(parse('(if (> 1 2) (+ 6 9) (+ 9 4))'))
// console.log(parse('(if (> 10 20) (+ 1 1) (+ 3 3)) (if (< 10 20) (+ 1 1) (+ 3 3))'))
// console.log(parse('(if (> 1 2) (if (< 2 1) (+ 1 2 3 4) (+ 3 3)))'))
// console.log(parse('(if (< 1 2) (if (< 2 1) (+ 1 1) (+ 3 3)) (+ 4 4))'))
// console.log(parse('(if (<= 1 2) (if (<= 2 2) (+ 1 1) (+ 3 3)) (+ 4 4))'))
// console.log(parse('(if (< 20 10) (if (< 20 10) (+ 4 4) (+ 5 5)) (if (> 20 10) (if (< 20 10) (if (< 20 10) (+ 4 4) (+ 5 5)) (if (> 20 10) (+ 4 4) (+ 5 5))) (+ 5 5)))'))

// console.log(parse('(define r 4)'))
// console.log(parse('(define)'))
// console.log(parse('(define lamda 10)'))
// console.log(parse('(define r 10)r'))
// console.log(parse('(define k 8)(* k k)'))
// console.log(parse('(define k 8)(* r)'))
// console.log(parse('(define k 10)'))
// console.log(parse('(define add (lambda (x y) (* x y)))'))
// console.log(parse('(add 6 8)'))
// console.log(parse('((lambda (x) (+ x x))4)'))
// console.log(parse('(define k 10)'))
// console.log(parse('((lambda (z y) (+ k z y))2 4)'))

// console.log(parse('(> 6 3 5 2 1)'))
// console.log(parse('(> 4 3 1)'))
// console.log(parse('(< 1 4 2)'))
// console.log(parse('(< 2 3 4)'))
// console.log(parse('(>= 4 3 2 )'))
