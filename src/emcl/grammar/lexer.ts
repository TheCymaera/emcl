import { LexerBuilder } from "../../compiler-builder/LexerBuilder.js";

export const lexGrammar = new LexerBuilder();

lexGrammar.define("WHITESPACE", /[^\S\r\n]+|(?:\r?\n)/);
lexGrammar.define("COMMENT", /\/\/.*/);
lexGrammar.define("COMMENT", /\/\*[^]+?\*\//);

lexGrammar.define((match)=>{
	switch (match) {
		case "mcfunction"	: return "MCFUNCTION";
		case "mccommand"	: return "MCCOMMAND";
		case "mcsubcommand"	: return "MCSUBCOMMAND";

		case "score"		: return "SCORE";
		case "nbt"			: return "NBT";

		case "alias"		: return "ALIAS";
		
		case "import"		: return "IMPORT";
		case "for"			: return "FOR";
		case "while"		: return "WHILE";
		case "if"			:
		case "execute"		: return "EXECUTE";
		
		case "const"		: return "CONST";
		case "int"			:
		case "float"		:
		case "bool"			:
		case "void"			:
		case "string"		:
		case "char"			: return "TYPE";
	}

	return "IDENTIFIER";
}, /[a-zA-Z_][a-zA-Z0-9_]*/);

lexGrammar.define("STRING_LITERAL", /"(?:\\.|[^\\"])*"/);
lexGrammar.define("STRING_LITERAL", /'(?:\\.|[^\\'])*'/);
lexGrammar.define("FLOAT_LITERAL", /(?:\d*\.\d+)f?/);
lexGrammar.define("DOUBLE_LITERAL", /(?:\d*\.\d+)d?/);
lexGrammar.define("BOOLEAN_LITERAL", /(?:true)|(?:false)/);
lexGrammar.define("INT_LITERAL", /\d+/);

lexGrammar.define("MCCOMMENT_LITERAL", /#[^\n;]+/);
lexGrammar.define("MCCOMMAND_LITERAL", /\/\w[^\n;]+/);

for (const op of [";", ",", ":", "{", "}", "(", ")", "[", "]"]) lexGrammar.defineString(op, op);

lexGrammar.defineString("COMPOUND_ASSIGNMENT_OPERATOR",["+=","-=","*=","/=","%="]);
lexGrammar.defineString("INC_OPERATOR", ["++", "--"]);

lexGrammar.defineString("MULTIPLICATIVE_OPERATOR", ["*", "/", "%"]);
lexGrammar.defineString("ADDITIVE_OPERATOR", ["+", "-"]);
lexGrammar.defineString("RELATIONAL_OPERATOR", ["<=", ">=", "<", ">"]);
lexGrammar.defineString("EQUALITY_OPERATOR", ["==", "!="]);
lexGrammar.defineString("AND_OPERATOR", "&&");
lexGrammar.defineString("OR_OPERATOR", "||");

lexGrammar.defineString("ASSIGNMENT_OPERATOR", "=");

export const lexer = lexGrammar.build();