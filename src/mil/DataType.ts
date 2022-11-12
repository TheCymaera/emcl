export enum DataType {
	Byte = "byte",
	Short = "short",
	Int = "int",
	Long = "long",
	Float = "float",
	Double = "double",
	String = "string",
}

export type IntegerType = DataType.Byte|DataType.Short|DataType.Int|DataType.Long;
export type DecimalType = DataType.Float|DataType.Double;
export type NumberType = IntegerType|DecimalType;
export namespace NumberType {
	export function isInt(dataType: DataType): dataType is IntegerType {
		return dataType === DataType.Byte || dataType === DataType.Short || dataType === DataType.Int || dataType === DataType.Long;
	}

	export function isDecimal(dataType: DataType): dataType is DecimalType {
		return dataType === DataType.Float || dataType === DataType.Double;
	}

	export function isNumber(dataType: DataType): dataType is NumberType {
		return isInt(dataType) || isDecimal(dataType);
	}

	export function specificity(type: NumberType) {
		switch(type) {
			case DataType.Byte	: return 1;
			case DataType.Short	: return 2;
			case DataType.Int	: return 3;
			case DataType.Long	: return 4;
			case DataType.Float	: return 5;
			case DataType.Double: return 6;
		}
	}

	export function maxSpecificity(type: NumberType, ...types: NumberType[]): NumberType {
		let max = type;
		for (const type of types) {
			if (specificity(type) > specificity(max)) max = type;
		}
		return max;
	}
}