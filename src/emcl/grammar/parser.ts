import { GrammarBuilder } from "../../compiler-builder/GrammarBuilder.js";
import { Block, Execute, If, Loop, MCCommandLiteral } from "../ast/controlFlow.js";
import { DefineMCFunction, Scope, Identifier, DeclareAlias, ExportValue, ImportModule, DeclareVariable, DeclareFunction, ReturnValue, FunctionParameter } from "../ast/definitions.js";
import { Assignment, BinaryOp, FunctionInvocation, MemberAccess, TypeCast } from "../ast/operators.js";
import { NumberType, NumberValue } from "../ast/typedValues/number.js";
import { StringType, StringValue } from "../ast/typedValues/string.js";
import { VoidType, VoidValue } from "../ast/typedValues/void.js";
import * as mil from "mil";
import { Type, type ASTNode } from "../ast/astNode.js";
import { NBTReference, ScoreReference } from "../ast/references.js";

const grammar = new GrammarBuilder<string, string, string>();

// parse literals (string, int)
grammar.define("string", ["STRING_LITERAL"],([lexeme])=>parseStringLiteral(lexeme));
grammar.define("int", ["INT_LITERAL"],([lexeme])=>parseInt(lexeme));
grammar.define("float", ["FLOAT_LITERAL"],([lexeme])=>parseFloat(lexeme));
grammar.define("boolean", ["BOOLEAN_LITERAL"],([lexeme])=>lexeme === "true");

// blocks
grammar.defineZeroOrMore("statement*", "statement");
grammar.define("statement*", ["statement*", ";"], GrammarBuilder.REDUCE_FIRST);
grammar.define("block", ["statement*"], ([statement_list])=>{
	return new Block(statement_list);
});

// statements
grammar.define("statement", ["MCCOMMENT_LITERAL"], ([comment])=>{
	return new MCCommandLiteral(comment);
});
grammar.define("statement", ["MCCOMMAND_LITERAL"], ([command])=>{
	return new MCCommandLiteral(command.slice(1));
});
grammar.define("statement", ["IMPORT", "string"], ([,uri])=>{
	return new ImportModule(uri, undefined);
});
grammar.define("statement", ["IMPORT", "string", "AS", "IDENTIFIER"], ([,uri,,identifier])=>{
	return new ImportModule(uri, identifier);
});
grammar.define("statement", ["ALIAS", "IDENTIFIER", "complete_expression"], ([,identifier,value])=>{
	return new DeclareAlias(identifier, value);
});
grammar.define("statement", ["MCFUNCTION", "string", "{", "block", "}"],([,namespacedId,,block,])=>{
	return new DefineMCFunction(namespacedId, new Scope(block));
});
grammar.define("statement", ["FOR", "(", "terminated_statement", "terminated_statement", "complete_expression", ")", "statement"],([,,init,condition,afterthought,,then])=>{
	return new Loop(init, condition, afterthought, then, false);
});
grammar.define("statement", ["FOR", "(", "terminated_statement", "terminated_statement", ")", "statement"],([,,init,condition,,then])=>{
	return new Loop(init, condition, new VoidValue, then, false);
});
grammar.define("statement", ["WHILE", "(", "complete_expression", ")", "statement"],([,,condition,,then])=>{
	return new Loop(new VoidValue, condition, new VoidValue, then, false);
});
grammar.define("statement", ["DO", "(", "complete_expression", ")", "WHILE", "statement"],([,,condition,,,then])=>{
	return new Loop(new VoidValue, condition, new VoidValue, then, true);
});
grammar.define("statement", ["IF", "(", "complete_expression", ")", "statement"], ([,,condition,,then])=>{
	return new If(condition, then);
});
grammar.define("statement", ["EXECUTE", "(", "complete_expression", ")", "statement"], ([,,subcommand,,then])=>{
	return new Execute(subcommand, then);
});
grammar.define("statement", ["EXECUTE", "string", "statement"], ([,subcommand,then])=>{
	return new Execute(new StringValue(subcommand), then);
});
grammar.define("statement", ["complete_expression"], GrammarBuilder.REDUCE_FIRST);
grammar.define("statement", ["{", "block", "}"], ([,block,])=>{
	return new Scope(block);
});

grammar.define("statement", ["variable_declaration"], GrammarBuilder.REDUCE_FIRST);

grammar.define("statement", ["EXPORT", "variable_declaration"], ([,statement]: [any, DeclareVariable])=>{
	return new ExportValue(statement.identifier, statement);
});

grammar.define("variable_declaration", ["type", "IDENTIFIER", "=", "complete_expression"], ([type,identifier,, value])=>{
	return new DeclareVariable(type, identifier, value);
});


grammar.define("parameter_declaration", ["type", "IDENTIFIER"], ([type,name])=>{
	return new FunctionParameter(type, name);
});
grammar.defineTrailingDelimitedList("parameter_declaration_list", "parameter_declaration_non_terminated", "parameter_declaration", ",", true);
grammar.define("statement", ["type", "IDENTIFIER", "(", "parameter_declaration_list", ")", "{", "block" ,"}"], ([type,name,,parameters,,,block])=>{
	return new DeclareFunction(type, name, new Map(parameters.entries()), block);
});
grammar.define("statement", ["RETURN", "complete_expression"], ([,value])=>{
	return new ReturnValue(value);
});


grammar.define("terminated_statement", ["statement", ";"], GrammarBuilder.REDUCE_FIRST);

// expressions (lowest to highest)
grammar.define("complete_expression", ["or_expression"]);
grammar.define("complete_expression", ["or_expression","=","complete_expression"],([dst,,src])=>new Assignment(dst,"=",src));
grammar.define("complete_expression", ["or_expression","COMPOUND_ASSIGNMENT_OPERATOR","complete_expression"],([dst,op,src])=>new Assignment(dst,op,src));

const reduceBinaryOp = ([lhs,op,rhs]: [ASTNode, string, ASTNode])=>new BinaryOp(lhs,op,rhs);
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
	if (op === "-") return BinaryOp.negative(value);
	throw new Error(`EMCL Parser: Unsupported prefix op "${op}".`);
});
grammar.define("unary_expression", ["!","unary_expression"], ([op,value])=>{
	return BinaryOp.not(value);
});
grammar.define("unary_expression", ["INC_OPERATOR", "unary_expression"], ([op,value])=>{
	if (op === "++") return Assignment.inc(value);
	if (op === "--") return Assignment.dec(value);
	throw new Error(`EMCL Parser: Unsupported prefix op "${op}".`);
});

grammar.define("primary_expression", ["(","complete_expression",")"], GrammarBuilder.REDUCE_NTH(1));
grammar.define("primary_expression", ["IDENTIFIER"], ([value])=>new Identifier(value));
grammar.define("primary_expression", ["string"], ([value])=>new StringValue(value));
grammar.define("primary_expression", ["int"], ([value])=>NumberValue.constant(mil.DataType.Int, value));
grammar.define("primary_expression", ["float"], ([value])=>NumberValue.constant(mil.DataType.Float, value));
grammar.define("primary_expression", ["primary_expression",".","IDENTIFIER"], ([value,,member])=>{
	return new MemberAccess(value, member);
});
grammar.define("primary_expression", ["(", "type", ")", "primary_expression"], ([,type, ,value])=>{
	return new TypeCast(type, value);
});

grammar.define("primary_expression", ["SCORE", "string", "string"], ([,objective, player])=>{
	return new ScoreReference(objective, player);
});

grammar.define("primary_expression", ["type", "NBT", "string", "string", "string"], ([type, , kind, target, path])=>{
	return new NBTReference(type, kind, target, path);
});

grammar.defineTrailingDelimitedList("parameter_list", "parameter_list_non_trailing", "complete_expression", ",", true)

grammar.define("primary_expression", ["primary_expression", "(", "parameter_list", ")"], ([name,,parameters])=>{
	return new FunctionInvocation(name, new Map(parameters.entries()));
});

grammar.define("type", ["CONST","type"], ([,type]: [unknown,Type])=>{
	type.isConst = true;
	return type;
});

grammar.define("type", ["FINAL","type"], ([,type]: [unknown,Type])=>{
	type.isFinal = true;
	return type;
});

grammar.define("type", ["TYPE"], ([name])=>{
	if (name === "byte" || name === "uint8") return new NumberType(mil.DataType.Byte);
	if (name === "short" || name === "uint16") return new NumberType(mil.DataType.Short);
	if (name === "int" || name === "uint32") return new NumberType(mil.DataType.Int);
	if (name === "long" || name === "uint64") return new NumberType(mil.DataType.Long);

	if (name === "float") return new NumberType(mil.DataType.Float);
	if (name === "double") return new NumberType(mil.DataType.Double);
	
	if (name === "string") return new StringType();
	if (name === "void") return new VoidType();

	throw new Error(`EMCL Parser: Unsupported type "${name}"`);
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