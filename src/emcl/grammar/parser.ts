import { GrammarBuilder } from "../../compiler-builder/GrammarBuilder";
import { Block, Execute, ImportModule, Loop, MCCommand, MCSubcommand } from "../ast/controlFlow.js";
import { DefineMCFunction, DeclareVariable, Scope, Identifier, DeclareAlias } from "../ast/definition.js";
import { Assignment, BinaryOperation } from "../ast/operators.js";
import * as mil from "../../mil/mil.js";
import { NumberType } from "../ast/dataTypes/number.js";
import { StringType } from "../ast/dataTypes/string.js";
import { Value } from "../ast/astNode.js";
import { VoidType } from "../ast/dataTypes/void.js";
import { NBT, Score } from "../ast/dataTypes/addresses.js";

const grammar = new GrammarBuilder<string, string, string>();

// parse literals (string, int)
grammar.define("string", ["STRING_LITERAL"],([lexeme])=>parseStringLiteral(lexeme));
grammar.define("int", ["INT_LITERAL"],([lexeme])=>parseInt(lexeme));
grammar.define("float", ["FLOAT_LITERAL"],([lexeme])=>parseFloat(lexeme));
grammar.define("boolean", ["BOOLEAN_LITERAL"],([lexeme])=>lexeme === "true");

// block
grammar.defineZeroOrMore("statement*", "statement");
grammar.define("statement*", ["statement*", ";"], GrammarBuilder.REDUCE_FIRST);
grammar.define("block", ["statement*"], ([statement_list])=>{
	return new Block(statement_list);
});

// statement
grammar.define("statement", ["MCCOMMENT_LITERAL"], ([comment])=>{
	return new MCCommand(StringType.constant(comment));
});
grammar.define("statement", ["IMPORT", "string"], ([,uri])=>{
	return new ImportModule(uri);
});
grammar.define("statement", ["ALIAS", "IDENTIFIER", "alias_value"], ([,identifier,value])=>{
	//return new AliasDefinition(identifier,value);
});
grammar.define("statement", ["MCCOMMAND_LITERAL"], ([command])=>{
	return new MCCommand(command.slice(1));
});
grammar.define("statement", ["MCFUNCTION", "string", "{", "block", "}"],([,namespacedId,,block,])=>{
	return new DefineMCFunction(namespacedId, new Scope(block));
});
grammar.define("statement", ["FOR", "(", "terminated_statement", "terminated_statement", "complete_expression", ")", "statement"],([,,init,condition,afterthought,,then])=>{
	return new Scope(new Loop(init, condition, afterthought, then, false));
});
grammar.define("statement", ["FOR", "(", "terminated_statement", "terminated_statement", ")", "statement"],([,,init,condition,,then])=>{
	return new Scope(new Loop(init, condition, VoidType.value(), then, false));
});
grammar.define("statement", ["WHILE", "(", "complete_expression", ")", "statement"],([,,condition,,then])=>{
	return new Scope(new Loop(VoidType.value(), condition, VoidType.value(), then, false));
});
grammar.define("statement", ["DO", "(", "complete_expression", ")", "WHILE", "statement"],([,,condition,,,then])=>{
	return new Scope(new Loop(VoidType.value(), condition, VoidType.value(), then, true));
});
grammar.define("statement", ["EXECUTE", "(", "complete_expression", ")", "statement"], ([,,condition,,then])=>{
	return new Execute(condition, then);
});
grammar.define("statement", ["EXECUTE", "string", "statement"], ([,subcommand,then])=>{
	return new Execute(new MCSubcommand(StringType.constant(subcommand)), then);
});
grammar.define("statement", ["complete_expression"], GrammarBuilder.REDUCE_FIRST);
grammar.define("statement", ["{", "block", "}"], ([,block,])=>{
	return new Scope(block);
});

grammar.define("statement", ["type", "IDENTIFIER", "ASSIGNMENT_OPERATOR", "complete_expression"], ([type,identifier,, value])=>{
	return new DeclareVariable(type, identifier, value);
});


grammar.define("statement", ["ALIAS", "IDENTIFIER", "aliasValue"], ([,identifier,value])=>{
	return new DeclareAlias(identifier, value);
});

grammar.define("terminated_statement", ["statement", ";"], GrammarBuilder.REDUCE_FIRST);

// expressions (lowest to highest)
grammar.define("complete_expression", ["or_expression"]);
grammar.define("complete_expression", ["or_expression","ASSIGNMENT_OPERATOR","complete_expression"],([dst,,src])=>new Assignment(dst,src));
grammar.define("complete_expression", ["or_expression","COMPOUND_ASSIGNMENT_OPERATOR","complete_expression"],([dst,op,src])=>Assignment.compound(dst,op,src));

const reduceBinaryOp = ([lhs,op,rhs])=>new BinaryOperation(lhs,op,rhs);
grammar.define("or_expression", ["and_expression"]);
grammar.define("or_expression", ["or_expression","OR_OPERATOR","and_expression"], reduceBinaryOp);

grammar.define("and_expression", ["equality_expression"]);
grammar.define("and_expression", ["and_expression","AND_OPERATOR","equality_expression"], reduceBinaryOp);

grammar.define("equality_expression", ["relational_expression"]);
grammar.define("equality_expression", ["equality_expression","EQUALITY_OPERATOR","relational_expression"], reduceBinaryOp);

grammar.define("relational_expression", ["additive_expression"]);
grammar.define("relational_expression", ["relational_expression","RELATIONAL_OPERATOR","additive_expression"], reduceBinaryOp);

grammar.define("additive_expression", ["multiplicative_expression"]);
grammar.define("additive_expression", ["additive_expression","ADDITIVE_OPERATOR","multiplicative_expression"], reduceBinaryOp);

grammar.define("multiplicative_expression", ["unary_expression"]);
grammar.define("multiplicative_expression", ["multiplicative_expression","MULTIPLICATIVE_OPERATOR","unary_expression"], reduceBinaryOp);

grammar.define("unary_expression", ["primary_expression"]);
grammar.define("unary_expression", ["ADDITIVE_OPERATOR","unary_expression"], ([op,value])=>{
	if (op === "+") return value;
	if (op === "-") return BinaryOperation.negative(value);
	throw new Error(`EMCL Parser: Unsupported prefix op "${op}".`);
});
grammar.define("unary_expression", ["INC_OPERATOR", "unary_expression"], ([op,value])=>{
	if (op === "++") return Assignment.inc(value);
	if (op === "--") return Assignment.dec(value);
	throw new Error(`EMCL Parser: Unsupported prefix op "${op}".`);
});
grammar.define("unary_expression", ["unary_expression", "INC_OPERATOR"], ([value,op])=>{
	throw new Error(`EMCL Parser: Unsupported postfix op "${op}".`);
});
grammar.define("unary_expression", ["NOT_OPERATOR","unary_expression"], ([,value])=>{
	return BinaryOperation.not(value);
});

grammar.define("primary_expression", ["(","complete_expression",")"], GrammarBuilder.REDUCE_NTH(1));
grammar.define("primary_expression", ["MCCOMMAND_LITERAL"], ([command])=>new MCCommand(StringType.constant(command.slice(1))));
grammar.define("primary_expression", ["MCCOMMAND", "complete_expression"], ([,child])=>new MCCommand(child));
grammar.define("primary_expression", ["MCSUBCOMMAND", "complete_expression"], ([,child])=>new MCSubcommand(child));

grammar.define("primary_expression", ["IDENTIFIER"], ([value])=>new Identifier(value));

grammar.define("primary_expression", ["string"], ([value])=>StringType.constant(value));
grammar.define("primary_expression", ["int"], ([value])=>NumberType.constant(value, NumberType.INT));
grammar.define("primary_expression", ["float"], ([value])=>NumberType.constant(value, NumberType.FLOAT));
grammar.define("primary_expression", ["bool"], ([value])=>NumberType.constant(value ? 1 : 0, NumberType.INT));
grammar.define("primary_expression", ["aliasValue"], GrammarBuilder.REDUCE_FIRST)

grammar.define("type", ["CONST","type"], ([,type])=>{
	type.constant = true;
	return type;
});

grammar.define("type", ["TYPE"], ([name])=>{
	if (name === "int") return new NumberType(NumberType.INT, false);
	if (name === "float") return new NumberType(NumberType.FLOAT, false);
	//if (name === "bool") return new BooleanType(false);
	if (name === "string") return new StringType(false);
	throw new Error(`EMCL Parser: Unsupported type "${name}"`)
});

grammar.define("type", ["TYPE", "<", "int", ">"], ([name, resolution])=>{
	if (name === "float") return new NumberType(resolution, false);
	throw new Error(`EMCL Parser: Unsupported type "${name}<${resolution}>"`)
});


grammar.define("aliasValue", ["SCORE", "string", "string"], ([,objective, player])=>{
	const type = new NumberType(1, false);
	return new Value(type, new Score(new mil.ScoreAccess(objective, player)));
});
grammar.define("aliasValue", ["type", "SCORE", "string", "string"], ([type, ,objective, player])=>{
	return new Value(type, new Score(new mil.ScoreAccess(objective, player)));
});

grammar.define("aliasValue", ["type", "NBT", "string", "string", "string", "string"], ([type,,kind, target, path, dataType])=>{
	return new Value(type, new NBT(new mil.NBTAccess(kind, target, path, dataType)));
});

export const parser = grammar.buildParser("block", "<EOI>");
export const treeBuilder = grammar.buildTreeBuilder();

function parseStringLiteral(literal: string) {
	return literal.slice(1,literal.length-1).replace(/\\(u[0-9a-fA-F]{4}|[^u])/, (_, escape) => {
		const char = escape.charAt(0);
		if (char === "u") return String.fromCharCode(parseInt(escape.slice(1), 16));
		switch(char) {
			case "b": return "\b";
			case "f": return "\f";
			case "n": return "\n";
			case "r": return "\r";
			case "t": return "\t";
			default : return char;
		}
	});
}