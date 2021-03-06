const globalObj = {}

const regex = {
  space: /^\s+/,
  number: /^(?:-)?(?:0|\d+)(?:\.\d+)?(?:(?:e|E)(?:\+|-)?\d+)?/,
  symbol: /^[a-zA-Z]+/,
  if: /^((\s*)\((\s*)if(\s*))/,
  define: /^((\s*)\((\s*)define(\s*))/,
  lambda: /^((\(\s*)\(?(\s*)lambda(\s*))/,
  exp: /^(\s*)\((\s*)/,
  boolean: /^(\s*)(#t|#f)/
}

const spaceParser = input => regexParser(input, regex.space)
const symbolParser = input => regexParser(input, regex.symbol)
const booleanParser = input => regexParser(input, regex.boolean)

const regexParser = (input, regex) => {
  input = input + ''
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
  '=': args => comparator(args, '='),
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
const expressionParser = (input, scope) => {
  const expr = regexParser(input, regex.exp)
  if (!expr) { return null }
  input = expr[1]
  const arr = []
  const operator = input.slice(0, input.indexOf(' '))
  const currentOperator = operators[operator]
  if (!currentOperator) {
    return null
  }
  input = input.slice(operator.length + 1)
  input = trimSpaces(input)
  while (input[0] !== ')') {
    // Recursively call when it encounters '('
    if (input[0] === '(') {
      const result = allParser(input, scope)
      arr.push(result[0])
      input = trimSpaces(result[1])
      continue
    }
    const numOutPut = valueParser(input, scope)
    const value = getValue(numOutPut[0], scope)
    arr.push(value)
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
    let value = valueParser(input)
    if (value) { return value }
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
const ifParser = (input, scope) => {
  const exp = regexParser(input, regex.if)
  if (!exp) { return null }
  input = exp[1]
  let result
  // Evaluating the condition of if expression
  const condition = valueParser(input, scope)
  const ifCondition = extractExpression(trimSpaces(condition[1]))
  const elseCondition = extractExpression(trimSpaces(ifCondition[1]))
  // When there is no else block statement
  input = trimSpaces(ifCondition[1])

  if (elseCondition) {
    input = trimSpaces(elseCondition[1])
  }
  if (input[0] !== ')') {
    throw new Error('invalid if syntax')
  }
  // Executing true block statement
  if (condition[0] && condition[0] !== '#f') {
    result = allParser(ifCondition[0], scope)
  } else { // Executing false block statement
    if (!elseCondition) {
      throw new Error('Else Condition not defined')
    }
    result = allParser(elseCondition[0], scope)
  }
  return [result[0], input.slice(1)]
}

/*
*parsing the define expression
*/
const defineParser = (input, scope) => {
  const exp = regexParser(input, regex.define)
  if (!exp) { return null }
  input = exp[1]
  // checking for symbol
  const symbol = symbolParser(input)
  if (!symbol) {
    throw new Error('Error: define: symbol or pair expected but got undefined []')
  }
  input = trimSpaces(symbol[1])
  // checking for value(either lambda or simple expression) and saving it to globalObj
  const value = lambdaParser(input, scope) || valueParser(input, scope)
  globalObj[symbol[0]] = value ? value[0] : ''
  input = trimSpaces(value[1].slice(1))
  return ['', input]
}

/**
 * parsing lambda expression
*/
const lambdaParser = (input, scope) => {
  const exp = regexParser(input, regex.lambda)
  if (!exp) { return null }
  input = exp[1]
  const values = []
  // Extracting the arguments of lambda expression
  const arg = getArguments(trimSpaces(input), scope)
  input = arg[1]
  // Extracting the body of lambda expression
  const bodyExp = extractExpression(trimSpaces(input))
  input = trimSpaces(bodyExp[1])
  if (input[0] !== ')') {
    throw new Error('Invalid Lambda expression')
  }
  input = trimSpaces(input.slice('1'))
  // Extracting the values if self invoking
  if (input && input[0] !== ')') {
    while (input[0] !== ')') {
      const num = valueParser(input, scope)
      values.push(getValue(num[0], scope))
      input = trimSpaces(num[1])
    }
    if (arg[0].length !== values.length) {
      throw new Error('arguments mismatch')
    }
    const fnObj = context(bodyExp[0], arg[0], values, scope || globalObj)
    const result = allParser(fnObj.fnBody, fnObj)
    return [result[0], input.slice(1)]
  }
  // Mapping the argument with the respective values
  const result = context(bodyExp[0], arg[0], values, scope || globalObj)
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
      if (key in this) return this[key]
      return (this.parent.hasOwnProperty('find') && this.parent.find(key)) || this.parent[key]
    }
  }
  return Object.assign({}, param, fn)
}

/**
 * Getting arguments of Lambda expression
 */
const getArguments = (input, scope) => {
  const expr = regexParser(input, regex.exp)
  if (!expr) { return null }
  input = expr[1]
  const arg = []
  while (input[0] !== ')') {
    const ele = valueParser(input, scope)
    if (!ele) {
      return null
    }
    arg.push(ele[0])
    input = trimSpaces(ele[1])
  }
  return [arg, input.slice(1)]
}

/**
 * To handle function invokation call
 */
const callParser = (input, scope) => {
  if (input[0] !== '(') {
    return null
  }
  const fn = getArguments(input, scope)
  const [fnName, ...values] = fn[0]
  if (!(fnName in globalObj)) {
    return null
  }
  const _obj = globalObj[fnName]
  const obj = context(_obj.fnBody, _obj.args, values, scope || globalObj)
  obj.args.forEach((value, index) => {
    obj[value] = getValue(values[index], scope)
  })
  if (obj.args.length !== values.length) {
    throw new Error('arguments mismatch')
  }
  const result = allParser(obj.fnBody, obj)
  return [result[0], trimSpaces(fn[1])]
}

/**
 * Get value from local scope if present
 * else from global if present
 * otherwise return value if it is a number
 */
const getValue = (value, scope) => {
  if (scope) {
    const val = scope.find(value)
    if (typeof val !== 'undefined') {
      return val
    }
  }
  if (globalObj.hasOwnProperty(value)) {
    return globalObj[value]
  }
  if (isNaN(value)) {
    throw new Error(`Symbol ${value} is not defined`)
  }
  return value
}

const factoryParser = (...parsers) => {
  return function (input, scope) {
    for (const value of parsers) {
      const valueOutput = value(input, scope)
      if (valueOutput) {
        return valueOutput
      }
    }
    return null
  }
}
const valueParser = factoryParser(numberParser, expressionParser, symbolParser, booleanParser)
const allParser = factoryParser(numberParser, ifParser, expressionParser, defineParser, lambdaParser, symbolParser, callParser, booleanParser)

/**
 *parsing all parsers
*/
const parse = (input) => {
  try {
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
  } catch (e) {
    return e.message || 'Invalid'
  }
}

exports.lisp = parse

/**
 * Mathematical expression(simple & nested)
 */
// console.log(parse('(+ 8 1 0 9 0)'))
// console.log(parse('(+ 2 3 5)'))
// console.log(parse('(* 2 3 2)'))
// console.log(parse('(/ 4 2 2)'))
// console.log(parse('(1 2)'))
// console.log(parse('(+ (+ 1 2) (+ 3 4) 87)'))
// console.log(parse('(- (+ 1 2 9 9) (* 3 4) 87)'))
// console.log(parse('(+ (* 6 9) (/ 9 4) 9)'))
// console.log(parse('(min 1 8 3 4 5)'))

/**
 * comparision operator expression(simple & nested)
 */
// console.log(parse('(> 6 3 5 2 1(< 6 4 8 9))'))
// console.log(parse('(> 4 3 1)'))
// console.log(parse('(< 1 4 2)'))
// console.log(parse('(< 2 3 4)'))
// console.log(parse('(>= 4 3 2 )'))

/**
 * if expression(simple and nested)
 */
// console.log(parse('(if (<= 1 1) (+ 2 2) (+ 1 1))'))
// console.log(parse('(if (< 1 2) (+ 6 9) (+ 9 4))'))
// console.log(parse('(if (> 1 2) (+ 6 9) (+ 9 4))'))
// console.log(parse('(if (> 10 20) (+ 1 1) (+ 3 3)) (if (< 10 20) (+ 1 1) (+ 3 3))'))
// console.log(parse('(if (> 1 2) (if (< 2 1) (+ 1 2 3 4) (+ 3 3)))'))
// console.log(parse('(if (< 1 2) (if (< 2 1) (+ 1 1) (+ 3 3)) (+ 4 4))'))
// console.log(parse('(if (<= 1 2) (if (<= 2 2) (+ 1 1) (+ 3 3)) (+ 4 4))'))
// console.log(parse('(if (< 20 10) (if (< 20 10) (+ 4 4) (+ 5 5)) (if (> 20 10) (if (< 20 10) (if (< 20 10) (+ 4 4) (+ 5 5)) (if (> 20 10) (+ 4 4) (+ 5 5))) (+ 5 5)))'))

/**
 * if expression with boolean and number parser
 */
// console.log(parse('(if 2 3 2)'))
// console.log(parse('(if #f #t #f)'))
// console.log(parse('(if #f 6 9)'))
// console.log(parse('(if (> 6 8) #t #f)'))

/**
 * define and if expression
 */
// console.log(parse('(define r 7)'))
// console.log(parse('(define one 1)'))
// console.log(parse('(if (= one 2) (+ one 1) (- one 1))'))
// console.log(parse('(define k (+ 4 7))'))
// console.log(parse('(if (> k r) (+ r 9) (+ k 4))'))

/**
 * define and lambda expression(simple)
 */
// console.log(parse('(define)'))
// console.log(parse('(define lamda 10)'))
// console.log(parse('(define r 10)r'))
// console.log(parse('(define k 8)(* k k)'))
// console.log(parse('(define k 8)(* r)'))
// console.log(parse('(define x 10)'))
// console.log(parse('(define add (lambda (x y) (* x y)))'))
// console.log(parse('(add 6 8)'))
// console.log(parse('((lambda (x) (+ x x))x)'))

/**
 * define, if, lambda expression(nested and selfinvoking)
 */
// console.log(parse('(define i 10)'))
// console.log(parse('(define k 10)'))
// console.log(parse('(define y 10)'))
// console.log(parse('(define add (lambda (i k) (if (> i k) (+ i i) (+ k k)) ))'))
// console.log(parse('(add 5 9)'))
// console.log(parse('(define add (lambda (i k) ((lambda (i) (+ i k y))14) ))'))
// console.log(parse('(add 1 2)'))
// console.log(parse('((lambda (z y) (+ k z y))2 4)'))
// console.log(parse('(define circlearea (lambda (r) (* 3.14159 (* r r))))'))
// console.log(parse('(circlearea 3)'))
// console.log(parse('(define twice (lambda (x) (* 2 x)))'))
// console.log(parse('(twice (- k 3))'))
// console.log(parse('(define y 5)'))
// console.log(parse('(define add (lambda (x) (+ x x)))'))
// console.log(parse('(add 10)'))
// console.log(parse('((lambda (x) (+ x y)) 1)'))
// console.log(parse('((lambda (a b) (if(> a b) (+ a a) (+ b b))) 10 20)'))
// console.log(parse('((lambda (n m) (if(> n m) (add n) (add m))) 12 14)'))
// console.log(parse('((lambda (i k) ((lambda (i) (+ i k y))9)) 77 77)'))
// console.log(parse('((lambda (i k) ((lambda (i k) (+ i k)) 1 9)) 2 3)'))

/**
 * Recursive lambda expression
 */
// console.log(parse('(define fac (lambda (n) (if (= n 0) 1 (* n (fac (- n 1))))))'))
// console.log(parse('(fac 5)'))
// console.log(parse('(define fib (lambda (n)(if (= n 0) 0 (if (= n 1) 1 (+ (fib (- n 1)) (fib (- n 2)))))))'))
// console.log(parse('(fib 15)'))
