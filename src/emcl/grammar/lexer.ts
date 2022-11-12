import { LexerBuilder } from "../../compiler-builder/LexerBuilder.js";

export const lexGrammar = new LexerBuilder();

lexGrammar.define("WHITESPACE", /[^\S\r\n]+|(?:\r?\n)/);
lexGrammar.define("COMMENT", /\/\/.*/);
lexGrammar.define("COMMENT", /\/\*[^]+?\*\//);

lexGrammar.defineKeyword("MCFUNCTION", "mcfunction");
lexGrammar.defineKeyword("SCORE", "score");
lexGrammar.defineKeyword("NBT", "nbt");

lexGrammar.defineKeyword("ALIAS", "alias");

lexGrammar.defineKeyword("IMPORT", "import");
lexGrammar.defineKeyword("AS", "as");
lexGrammar.defineKeyword("FOR", "for");
lexGrammar.defineKeyword("WHILE", "while");
lexGrammar.defineKeyword("IF", "if");
lexGrammar.defineKeyword("EXECUTE", "execute");
lexGrammar.defineKeyword("RETURN", "return");

lexGrammar.defineKeyword("CONST", "const");
lexGrammar.defineKeyword("FINAL", "final");


lexGrammar.defineKeyword("TYPE", [
	"uint8", "byte",
	"uint16", "short",
	"uint32", "int",
	"uint64", "long",
	
	"float",
	"double",

	"bool",
	"void",
	"string",
]);

lexGrammar.define("IDENTIFIER", /[a-zA-Z_][a-zA-Z0-9_]*/);

lexGrammar.define("STRING_LITERAL", /"(?:\\.|[^\\"])*"/);
lexGrammar.define("STRING_LITERAL", /'(?:\\.|[^\\'])*'/);
lexGrammar.define("FLOAT_LITERAL", /(?:\d*\.\d+)f?/);
lexGrammar.define("DOUBLE_LITERAL", /(?:\d*\.\d+)d?/);
lexGrammar.define("BOOLEAN_LITERAL", /(?:true)|(?:false)/);
lexGrammar.define("INT_LITERAL", /\d+/);

lexGrammar.define("MCCOMMENT_LITERAL", /#[^\n;]+/);
lexGrammar.define("MCCOMMAND_LITERAL", /\/\w[^\n;]+/);

for (const op of [";", ",", ":", "{", "}", "(", ")", "[", "]", "."]) lexGrammar.defineString(op, op);

lexGrammar.defineString("COMPOUND_ASSIGNMENT_OPERATOR",["+=","-=","*=","/=","%="]);
lexGrammar.defineString("INC_OPERATOR", ["++", "--"]);

lexGrammar.defineString("MULTIPLICATIVE_OPERATOR", ["*", "/", "%"]);
lexGrammar.defineString("ADDITIVE_OPERATOR", ["+", "-"]);
lexGrammar.defineString("RELATIONAL_OPERATOR", ["<=", ">=", "<", ">"]);
lexGrammar.defineString("EQUALITY_OPERATOR", ["==", "!="]);
lexGrammar.defineString("AND_OPERATOR", "&&");
lexGrammar.defineString("OR_OPERATOR", "||");

lexGrammar.defineString("!", "!");
lexGrammar.defineString("=", "=");

export const lexer = lexGrammar.build();