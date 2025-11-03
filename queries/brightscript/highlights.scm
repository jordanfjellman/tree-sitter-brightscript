; Keywords
[
  (sub_start)
  (function_start)
  (end_sub)
  (end_function)
] @keyword

[
  (if_start)
  (else)
  (else_if)
  (end_if)
  (then)
  (conditional_compl_end_if)
] @keyword

[
  (for_start)
  (while_start)
  (for_each)
  (for_in)
  (for_to)
  (for_step)
  (end_for)
  (end_while)
  (exit_while_statement)
  (exit_for_statement)
] @keyword

[
  (try_start)
  (try_catch)
  (throw)
  (end_try)
] @keyword

(return_statement) @keyword

; Function names
(function_name) @function

; All other identifiers are variables
(identifier) @variable

(parameter
  name: (identifier) @variable.parameter)

; Types
(type_annotation) @type
(type_identifier) @type

; Properties and method access
(property_access_expression
  property: (identifier) @property)

(member_expression
  property: (property_identifier) @property)

(callfunc_invocation
  method: (property_identifier) @property)

; Function calls
(function_call
  function: (prefix_exp
    (identifier) @function.call))

(call_expression
  function: (identifier) @function.call)

(call_expression
  function: (property_access_expression
    property: (identifier) @function.method))

(call_expression
  function: (member_expression
    property: (property_identifier) @function.method))

(call_expression
  function: (callfunc_invocation
    method: (property_identifier) @function.method))

; Built-in functions
(print) @function.builtin

; Operators
(binary_expression
  operator: (_) @operator)

(logical_not_expression
  operator: (_) @operator)

[
  (equals)
  (not_equals)
  (less_than)
  (less_than_or_equal)
  (greater_than)
  (greater_than_or_equal)
  (plus)
  (minus)
  (multiply)
  (divide)
  (backslash)
  (mod)
  (and)
  (or)
  (null_coalescing)
] @operator

[
  (prefix_increment_expression)
  (prefix_decrement_expression)
  (postfix_increment_expression)
  (postfix_decrement_expression)
] @operator

; Literals
(boolean) @boolean
(number) @number
(string) @string
(constant) @constant
(invalid) @constant.builtin

; Comments
(comment) @comment @spell

; Punctuation
[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

[
  "."
  ","
  "?."
  "@."
] @punctuation.delimiter

; Special statements
(library_statement) @keyword
(library_statement
  path: (string) @module)

; Array and associative array literals
(array) @constructor
(assoc_array) @constructor

(assoc_array_element
  key: (identifier) @property)
