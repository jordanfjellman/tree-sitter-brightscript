#include <tree_sitter/parser.h>

enum TokenType {
  EMPTY,
};

void *tree_sitter_brightscript_external_scanner_create() { return NULL; }
void tree_sitter_brightscript_external_scanner_destroy(void *p) {}
void tree_sitter_brightscript_external_scanner_reset(void *p) {}
unsigned tree_sitter_brightscript_external_scanner_serialize(void *p, char *buffer) { return 0; }
void tree_sitter_brightscript_external_scanner_deserialize(void *p, const char *b, unsigned n) {}

bool tree_sitter_brightscript_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  // The _empty token only succeeds when we're at the end keyword
  if (valid_symbols[EMPTY]) {
    // Skip whitespace and newlines
    while (lexer->lookahead == ' ' || lexer->lookahead == '\t' ||
           lexer->lookahead == '\n' || lexer->lookahead == '\r') {
      lexer->advance(lexer, true);
    }

    // Check if the next characters are "end" (case insensitive)
    if (lexer->lookahead == 'e' || lexer->lookahead == 'E') {
      lexer->mark_end(lexer);
      lexer->advance(lexer, false);
      if (lexer->lookahead == 'n' || lexer->lookahead == 'N') {
        lexer->advance(lexer, false);
        if (lexer->lookahead == 'd' || lexer->lookahead == 'D') {
          // We're at "end", so return true for empty token
          return true;
        }
      }
    }
  }
  return false;
}
