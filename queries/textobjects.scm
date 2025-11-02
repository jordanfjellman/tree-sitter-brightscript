; Function definition
(function_declaration) @function.outer

; If statement
(if_statement) @if.outer
(conditional_compl) @if.outer

; Else if clause
(else_if_clause) @elseif.outer
(conditional_compl_else_if_clause) @elseif.outer

; Else clause
(else_clause) @else.outer
(conditional_compl_else_clause) @elseif.outer

; For statement
(for_statement) @for.outer

; While statement
(while_statement) @while.outer

; Call expression
; (call_expression) @call.outer

; Property access expression
; (property_access_expression) @property.outer

; Binary expression (logical, arithmetic, comparison)
(binary_expression) @binary.outer

; Logical not expression
(logical_not_expression) @logical_not.outer

; Comment
(comment) @comment.outer

; String
(string_content) @attribute.inner
(string) @attribute.outer

