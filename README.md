# GeekSkool - Lisp Interpreter Project

### What is Lisp?

* Lisp is the second-oldest high-level programming language after Fortran and has changed a great deal since its early days, and a number of dialects have existed over its history. Today, the most widely known general-purpose Lisp dialects are Common Lisp and Scheme.Lisp was invented by John McCarthy in 1958

* Lisp is an expression oriented language. Unlike most other languages, no distinction is made between "expressions" and "statements", all code and data are written as expressions. When an expression is evaluated, it produces a value (in Common Lisp, possibly multiple values), which can then be embedded into other expressions. Each value can be any data type.

### Prerequisites

* Recursion: Before dealing with Lisp, the person should have a firm grasp of recursion.

* Basic Lisp: The person should be aware about what is a computer program and what is a computer programming language? One can practice few lisp expressions on the interpreter link given below.

_[lisp_interpreter](https://repl.it/repls/StiffShowyVirtualmachine)_

### What is Lisp Interpreter?

The heart of the Lisp interpreter is the "read-eval-print" loop. That is, the interpreter does the following three jobs over and over:

* read an input expression
* evaluate the expression
* print the results

LISP uses a very simple notation in which operations and their operands are given in a parenthesized list. 
For example, 
* (+ a (* b c)) stands for a + b*c
* (+ 2 2) stands for 4

_[lisp_wiki](https://en.wikipedia.org/wiki/Lisp_(programming_language))_

_[lisp](http://www.norvig.com/lispy.html)_

### How to run the application Locally

* clone/download the repository
* install node
* run command "node lisp_REPL.js" 
