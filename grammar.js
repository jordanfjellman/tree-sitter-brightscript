const PREC = {
  ASSIGNMENT: 1,
  TERNARY: 2,
  LOGICAL: 3,
  RETURN: 3,
  THROW: 3,
  IF: 3,
  COMPARISON: 4,
  ADDITIVE: 5,
  MULTIPLICATIVE: 6,
  UNARY: 7,
  LOGICAL_NOT: 8,
  PREFIX_INCREMENT: 9,
  PREFIX_DECREMENT: 9,
  POSTFIX_INCREMENT: 10,
  POSTFIX_DECREMENT: 10,
};

module.exports = grammar({
  name: 'brightscript',

  extras: ($) => [/[\n]/, /\s/, $.comment],

  externals: ($) => [
    $._empty
  ],

  inline: ($) => [
    $.function_impl,
    $.sub_impl,
    $.comment
  ],

  conflicts: ($) => [
    [$._expression, $._var],
    [$.property_identifier, $.identifier],
  ],

  rules: {
    source_file: $ => seq(
      any_amount_of($._definition),
      optional("\0")
    ),

    _definition: $ => seq(
      $._statement,
    ),

    library_statement: $ => seq(
      /library/i,
      field('path', $.string)
    ),

    function_start: () => /function/i,

    function_statement: $ => alias($._function_statement, 'function_declaration'),

    _function_statement: $ => seq(
      repeat($.decorator),
      seq($.function_start, /\s*/, field("name", $.function_name)),
      $.function_impl
    ),
    
    function_name: $ => $.identifier,

    annonymous_function: $ => seq(
      seq($.function_start),
      $.sub_impl
    ),

    function_impl: $ => seq(
      field('parameters', $.parameter_list),
      optional(field('return_type', $.return_type)),
      optional(field('body', $.block)),
      $.end_statement
    ),

    sub_start: () => /sub/i,

    sub_statement: $ => alias($._sub_statement, 'function_declaration'),

    _sub_statement: $ => seq(
      repeat($.decorator),
      seq($.sub_start, /\s*/, field("name", $.function_name)),
      $.sub_impl
    ),

    annonymous_sub: $ => seq(
      seq($.sub_start),
      $.sub_impl
    ),

    sub_impl: $ => seq(
      field('parameters', $.parameter_list),
      optional(field('body', $.block)),
      $.end_statement
    ),

    _statement: $ => prec.right(1, choice(
      $.function_declaration,  // BrighterScript function/sub declaration
      $.sub_statement,  // Legacy BrightScript
      $.function_statement,  // Legacy BrightScript
      $.library_statement,
      $.constant,
      $.const_declaration,
      $.class_declaration,
      $.interface_declaration,
      $.namespace_declaration,
      $.enum_declaration,
      $.import_declaration,
      $.if_statement,
      $.conditional_compl,
      $.while_statement,
      $.for_statement,
      $.try_statement,
      $._single_line_statement,
      // $.expression_statement,
    )),

    _single_line_statement: $ => prec(2, choice(
      $.return_statement,
      $.assignment_statement,
      $.exit_while_statement,
      $.continue_while_statement,
      $.continue_for_statement,
      $.exit_for_statement,
      $.function_call,
      $.call_expression,
      $.print_statement,
      $.throw_statement,
      $.increment_decrement_statement,
    )),

    _expression: $ => choice(
      $.call_expression,
      $.member_expression,
      $.array_access_expression,
      $.identifier,
      $.prefix_exp,
      $.string,
      $.number,
      $.literal,
      $.binary_expression,
      $.unary_expression,
      $.annonymous_sub,
      $.annonymous_function,
      $.source_literal,
      $.template_string,
      $.regex,
      $.ternary_expression,
      $.super
    ),

    conditional_compl: $ => seq(
      alias(/#if/, $.if_start),
      $._expression,
      $._new_line,
      repeat($._statement),
      optional($.conditional_compl_else_if_clause),
      optional($.conditional_compl_else_clause),
      $.end_statement
    ),

    conditional_compl_else_if_clause : $ => seq(
        alias(/#else if/, $.else_if),
        $._expression,
        $._new_line,
        repeat($._statement)
    ),

    conditional_compl_else_clause : $ => seq(
        alias(/#else/, $.else),
        $._new_line,
        repeat($._statement)
    ),

    // The main entry point for if statements
    if_statement: $ =>
      choice(
        $.multi_line_if,
        $.single_line_if,
      ),

    single_line_if: $ => prec.right(seq(
      alias(/if/i, $.if_start),
      $._expression,
      optional(alias(/then/i, $.then)),
      $._single_line_statement,
      optional(seq(
        alias(/else/i, $.else),
        $._single_line_statement
      )),
      choice(
        '\n',
        '\r\n',
        '\r'
      )
    )),

    // Multi-line if statement
    multi_line_if: $ => seq(
      alias(/if/i, $.if_start),
      $._expression,
      optional(alias(/then/i, $.then)),
      $.if_block,
    ),

    if_block: $ => seq(
      $._new_line,
      repeat($._statement),
      repeat($.else_if_clause),
      optional($.else_clause),
      $.end_statement
    ),

    single_line_if_block: $ => seq(
      $._statement,
      optional(seq(alias(/else/i, $.else), $._statement)),
    ),

    else_if_clause: $ => seq(
      alias(/else if/i, $.else_if),
      field('condition', $._expression),
      optional(alias(/then/i, $.then)),
      optional(field('consequence', repeat1($._statement)))
    ),

    else_clause: $ => seq(
      alias(/else/i, $.else),
      optional(field('consequence', repeat1($._statement)))
    ),

    for_statement: $ => seq(
      alias(/for/i, $.for_start),
      choice(
        seq(
          field('initializer', $.assignment_statement),
          alias(/to/i, $.for_to),
          field('condition', $._expression),
          optional(seq(alias(/step/i, $.for_step), field('increment', $._expression)))
        ),
        seq(
          alias(/each/i, $.for_each),
          field('variable', $._expression),
          alias(/in/i, $.for_in),
          field('collection', $._expression)
        )
      ),
      optional(field('body', $.block)),
      $.end_statement
    ),

    while_statement: $ => seq(
      alias(/while/i, $.while_start),
      field('condition', $._expression),
      optional(field('body', $.block)),
      $.end_statement
    ),

    try_statement: $ => seq(
      alias(/try/i, $.try_start),
      optional(field('body', $.block)),
      optional(field('handler', $.catch_clause)),
      $.end_statement
    ),

    catch_clause: $ => seq(
      alias(/catch/i, $.try_catch),
      field('exception', $.identifier),
      optional(field('body', $.block))
    ),

    exit_while_statement: $ => seq(
      /exit/i,
      /while/i
    ),

    continue_while_statement: $ => seq(
      /continue/i,
      /while/i
    ),

    exit_for_statement: $ => seq(
      /exit/i,
      /for/i
    ),

    continue_for_statement: $ => seq(
      /continue/i,
      /for/i
    ),

    return_statement: $ => prec.right(PREC.RETURN, seq(
      /return/i,
      optional($._expression)
    )),

    assignment_statement: $ => prec(PREC.ASSIGNMENT, seq(
      field('left', $._var),
      field('operator', choice('=', '+=', '-=', '*=', '/=', '\\=', '<<=', '>>=')),
      field('right', $._expression)
    )),

    print_statement: $ => seq(
      alias(choice(/print/i, '?'), $.print),
      field('arguments', seq($._expression, repeat(seq(choice(',', ';'), $._expression)))),
    ),

    throw_statement: $ => prec.right(PREC.THROW, seq(
      alias(/throw/i, $.throw),
      optional(field('value', $._expression))
    )),

    increment_decrement_statement: $ => choice(
      $.prefix_increment_expression,
      $.prefix_decrement_expression,
      $.postfix_increment_expression,
      $.postfix_decrement_expression,
    ),

    prefix_increment_expression: $ => prec.right(PREC.PREFIX_INCREMENT, seq('++', field('argument', $._expression))),
    prefix_decrement_expression: $ => prec.right(PREC.PREFIX_DECREMENT, seq('--', field('argument', $._expression))),
    postfix_increment_expression: $ => prec.left(PREC.POSTFIX_INCREMENT, seq(field('argument', $._expression), '++')),
    postfix_decrement_expression: $ => prec.left(PREC.POSTFIX_DECREMENT, seq(field('argument', $._expression), '--')),

    block: $ => repeat1(
      $._statement
    ),

    parameter_list: $ => seq(
      '(',
      commaSep($.parameter),
      ')'
    ),

    parameter: $ => seq(
      field('name', $.identifier),
      optional(seq('=', $._expression)),
      optional(
        field('type', $.type_annotation)
      )
    ),

    return_type: $ => field('return_type', $.type_annotation),

    type_annotation: $ => seq(
      /as/i,
      $.type_identifier
    ),

    _prefix_exp: ($) =>
      choice(
        $.function_call,
        seq($.left_paren, $._expression, $.right_paren)
      ),

    left_paren: (_) => "(",
    right_paren: (_) => ")",

    prefix_exp: ($) => $._prefix_exp,

    function_call: $ => prec.right(1,seq(
      field('function', $.prefix_exp),
      field('arguments', $.parenthesized_expression)
    )),

    _var: ($) =>
      choice(
        $.identifier,
        $.member_expression,
        $.array_access_expression
      ),

    // Expressions
    call_expression: $ => prec(15,seq(
      field('function', choice(
        $.identifier,
        $.property_access_expression,
        $.member_expression,
        $.callfunc_invocation
      )),
      field('arguments', $.arguments)
    )),

    binary_expression: $ => choice(
      prec.left(PREC.LOGICAL, seq(field('left', $._expression), field('operator', $.and), field('right', $._expression))),
      prec.left(PREC.LOGICAL, seq(field('left', $._expression), field('operator', $.or),  field('right', $._expression))),
      prec.left(PREC.COMPARISON, seq(field('left', $._expression), field('operator', $.equals),   field('right', $._expression))),
      prec.left(PREC.COMPARISON, seq(field('left', $._expression), field('operator', $.not_equals),  field('right', $._expression))),
      prec.left(PREC.COMPARISON, seq(field('left', $._expression), field('operator', $.less_than),   field('right', $._expression))),
      prec.left(PREC.COMPARISON, seq(field('left', $._expression), field('operator', $.less_than_or_equal),  field('right', $._expression))),
      prec.left(PREC.COMPARISON, seq(field('left', $._expression), field('operator', $.greater_than),   field('right', $._expression))),
      prec.left(PREC.COMPARISON, seq(field('left', $._expression), field('operator', $.greater_than_or_equal),  field('right', $._expression))),
      prec.left(PREC.COMPARISON, seq(field('left', $._expression), field('operator', $.null_coalescing),  field('right', $._expression))),
      prec.left(PREC.ADDITIVE, seq(field('left', $._expression), field('operator', $.plus), field('right', $._expression))),
      prec.left(PREC.ADDITIVE, seq(field('left', $._expression), field('operator', $.minus), field('right', $._expression))),
      prec.left(PREC.MULTIPLICATIVE, seq(field('left', $._expression), field('operator', $.multiply),  field('right', $._expression))),
      prec.left(PREC.MULTIPLICATIVE, seq(field('left', $._expression), field('operator', $.divide),  field('right', $._expression))),
      prec.left(PREC.MULTIPLICATIVE, seq(field('left', $._expression), field('operator', $.backslash),  field('right', $._expression))),
      prec.left(PREC.MULTIPLICATIVE, seq(field('left', $._expression), field('operator', $.mod), field('right', $._expression)))
    ),

    unary_expression: $ => prec.right(PREC.UNARY, choice(
      $.logical_not_expression,
    )),

    logical_not_expression: $ => prec.right(PREC.LOGICAL_NOT, seq(
      field('operator', $.not),
      field('argument', $._expression)
    )),

    parenthesized_expression: $ => seq(
      '(',
      commaSep($._expression),
      ')'
    ),

    arguments: $ => seq(
      '(',
      commaSep($._expression),
      ')'
    ),

    property_access_expression: $ => prec.left(2, seq(
      field('object', choice(
        $.identifier,
        $.property_access_expression,
        $.call_expression,
        $.array_access_expression
      )),
      choice('.', '?.'),
      field('property', choice(
        $.identifier,
        $.call_expression,
        $.array_access_expression
      ))
    )),

    // Member expression (for class member access like m.name or super.method())
    member_expression: $ => prec.left(3, seq(
      field('object', choice(
        $.identifier,
        $.super,
        $.member_expression
      )),
      '.',
      field('property', $.property_identifier)
    )),

    // Callfunc invocation (for @ operator like node@.method())
    callfunc_invocation: $ => prec.left(3, seq(
      field('object', choice(
        $.identifier,
        $.call_expression
      )),
      '@.',
      field('method', $.property_identifier)
    )),

    array_access_expression: $ => prec(1, seq(
      field('array', choice(
        $.identifier,
        $.array_access_expression,
        $.property_access_expression,
        $.call_expression
      )),
      '[',
      field('index', $._expression),
      ']'
    )),

    comment: $ => seq("'", /.*/),
    constant: $ => seq("#const", $.assignment_statement),
    const_declaration: $ => seq(
      'const',
      field('name', $.identifier),
      '=',
      field('value', choice(
        $.number,
        $.string,
        $.boolean
      ))
    ),

    // Literals
    literal: $ => choice(
      $.invalid,
      $.boolean,
      $.array,
      $.assoc_array
    ),

    boolean: $ => choice(
      /true/i,
      /false/i
    ),

    number: $ => /-?\d+(\.\d+)?/,

    string: $ => seq(
      '"',
      repeat(choice(
        alias(/[^"]+/, $.string_content),
        alias(seq('""'), $.escaped_quote)
      )),
      '"'
    ),

    string_contents: $ => /[^"]*/,

    invalid: $ => /invalid/i,

    array: $ => seq(
      '[',
      optional(commaSep($._expression)),
      ']'
    ),

    assoc_array: $ => seq(
      '{',
        optional(commaSepNewLine($.assoc_array_element)),
      '}'
    ),

    assoc_array_element: $ => seq(
      field('key', choice(
        $.identifier,
        $.string
      )),
      ':',
      field('value', $._expression)
    ),

    not: $ => /not/i,
    and: $ => /and/i,
    or: $ => /or/i,
    mod: $ => /mod/i,
    as: $ => /as/i,

    // Operator tokens (for field assignment in binary expressions)
    plus: $ => '+',
    minus: $ => '-',
    multiply: $ => '*',
    divide: $ => '/',
    backslash: $ => '\\',
    equals: $ => '=',
    not_equals: $ => '<>',
    less_than: $ => '<',
    less_than_or_equal: $ => '<=',
    greater_than: $ => '>',
    greater_than_or_equal: $ => '>=',
    null_coalescing: $ => '??',

    // Enum declaration
    enum_declaration: $ => seq(
      /enum/i,
      field('name', $.identifier),
      optional(field('body', $.enum_body)),
      /end\s+enum/i
    ),

    enum_body: $ => repeat1(
      $.enum_member
    ),

    enum_member: $ => seq(
      field('name', $.identifier),
      optional(seq('=', field('value', $.number)))
    ),

    // Import declaration
    import_declaration: $ => seq(
      /import/i,
      field('source', $.string),
      optional(seq(
        /as/i,
        field('alias', $.identifier)
      ))
    ),

    // Decorators
    decorator: $ => seq(
      '@',
      field('name', $.identifier),
      optional(field('arguments', $.arguments))
    ),

    // Class declarations
    class_declaration: $ => prec.right(seq(
      repeat($.decorator),
      /class/i,
      field('name', $.identifier),
      optional(field('superclass', $.extends_clause)),
      field('body', $.class_body),
      /end\s+class/i
    )),

    class_body: $ => choice(
      repeat1(choice(
        $.field_declaration,
        $.method_definition
      )),
      // Empty class body - use external token
      $._empty
    ),

    extends_clause: $ => seq(
      /extends/i,
      $.type_identifier
    ),

    field_declaration: $ => seq(
      optional(choice(
        $.accessibility_modifier,
        $.static_modifier,
        $.override_modifier
      )),
      field('name', $.identifier),
      field('type', $.type_annotation)
    ),

    method_definition: $ => seq(
      optional(choice(
        $.accessibility_modifier,
        $.static_modifier,
        $.override_modifier
      )),
      choice(/function/i, /sub/i),
      field('name', $.identifier),
      field('parameters', $.parameter_list),
      optional(field('return_type', $.type_annotation)),
      field('body', $.statement_block),
      /end\s+(function|sub)/i
    ),

    statement_block: $ => repeat1($._statement),

    accessibility_modifier: $ => choice(
      /public/i,
      /private/i,
      /protected/i
    ),

    static_modifier: $ => /static/i,
    override_modifier: $ => /override/i,

    // Interface declarations
    interface_declaration: $ => seq(
      /interface/i,
      field('name', $.identifier),
      field('body', $.interface_body),
      /end\s+interface/i
    ),

    interface_body: $ => choice(
      prec(1, repeat1($.method_signature)),
      // Empty interface body - use external token
      prec(0, $._empty)
    ),

    method_signature: $ => prec.dynamic(10, seq(
      choice(
        alias(token(prec(10, /sub/i)), 'sub'),
        alias(token(prec(10, /function/i)), 'function')
      ),
      field('name', $.identifier),
      field('parameters', $.parameter_list),
      optional(field('return_type', $.type_annotation))
    )),

    // Namespace declarations
    namespace_declaration: $ => seq(
      /namespace/i,
      field('name', $.namespace_name),
      field('body', $.namespace_body),
      /end\s+namespace/i
    ),

    namespace_name: $ => sep1($.identifier, '.'),

    namespace_body: $ => repeat1(choice(
      $.class_declaration,
      $.function_declaration
    )),

    // BrighterScript function declaration (used in namespaces, as top-level declarations)
    function_declaration: $ => prec.dynamic(1, seq(
      repeat($.decorator),
      choice(/function/i, /sub/i),
      field('name', $.identifier),
      field('parameters', $.parameter_list),
      optional(field('return_type', $.type_annotation)),
      field('body', $.statement_block),
      /end\s+(function|sub)/i
    )),

    // Type annotations
    type_annotation: $ => seq(
      /as/i,
      $.type_identifier
    ),

    type_identifier: $ => token(prec(0, /[a-zA-Z_][a-zA-Z0-9_]*/)),
    property_identifier: $ => token(prec(0, /[a-zA-Z_][a-zA-Z0-9_]*/)),

    // Super keyword for inheritance
    super: $ => /super/i,

    end_sub: $ => /end\s+sub/i,
    end_function: $ => /end\s+function/i,
    end_if: $ => /end\s+if/i,
    end_for: $ => choice(/end\s+for/i, token(prec(1, /next/i))),
    end_while: $ => /end\s+while/i,
    end_try: $ => /end\s+try/i,
    conditional_compl_end_if: $ => /#end\s+if/i,

    end_statement: $ => choice(
      $.end_sub,
      $.end_function,
      $.end_if,
      $.conditional_compl_end_if,
      $.end_for,
      $.end_while,
      $.end_try
    ),

    _new_line: $ => /\r?\n/,

    // Source literals for introspection
    source_literal: $ => choice(
      /SOURCE_FILE_PATH/,
      /SOURCE_LINE_NUM/,
      /SOURCE_FUNCTION_NAME/,
      /SOURCE_NAMESPACE_NAME/,
      /SOURCE_NAMESPACE_ROOT_NAME/,
      /SOURCE_LOCATION/,
      /PKG_PATH/,
      /PKG_LOCATION/
    ),

    // Template strings with interpolation
    template_string: $ => seq(
      '`',
      repeat(choice(
        $.template_fragment,
        $.template_interpolation
      )),
      '`'
    ),

    template_fragment: $ => token.immediate(prec(1, /[^`$]+/)),

    template_interpolation: $ => seq(
      '${',
      $._expression,
      '}'
    ),

    // Regular expressions
    regex: $ => seq(
      '/',
      field('pattern', $.regex_pattern),
      '/',
      optional(field('flags', $.regex_flags))
    ),

    regex_pattern: $ => token.immediate(prec(1, /([^\/\n\r]|\\.)+/)),
    regex_flags: $ => token.immediate(/[igms]+/),

    // Ternary operator
    ternary_expression: $ => prec.right(PREC.TERNARY, seq(
      field('condition', $._expression),
      '?',
      field('consequence', $._expression),
      ':',
      field('alternative', $._expression)
    )),

    // Miscellaneous
    identifier: $ => token(prec(0, /[a-zA-Z_][a-zA-Z0-9_]*/))
  }
});

function commaSep(rule) {
  return optional(
    seq(
      rule,
      repeat(
        seq(
          ',',
          rule
        )
      )
    )
  )
}

function commaSepNewLine(rule) {
  return optional(
    seq(
      rule,
      repeat(
        seq(
          optional(','),
          rule
        )
      )
    )
  )
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

function any_amount_of() {
  return repeat(seq(...arguments));
}

function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}
