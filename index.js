import { get as getWild } from 'wild-wild-path';
export class MissingValueError extends Error {
	constructor(key) {
		super(`Missing a value for ${key ? `the placeholder: ${key}` : 'a placeholder'}`, key);
		this.name = 'MissingValueError';
		this.key = key;
	}
}

export default function pupa(template, data, {ignoreMissing = false, transform = ({value}) => value} = {}) {
	if (typeof template !== 'string') {
		throw new TypeError(`Expected a \`string\` in the first argument, got \`${typeof template}\``);
	}

	if (typeof data !== 'object') {
		throw new TypeError(`Expected an \`object\` or \`Array\` in the second argument, got \`${typeof data}\``);
	}

	const replace = (placeholder, key) => {
		const value = getWild(data, key);

		const transformedValue = transform({value, key});

		return String(transformedValue);
	};

	const composeHtmlEscape = replacer => (...args) => replacer(...args);

	// The regex tries to match either a number inside `{{ }}` or a valid JS identifier or key path.
	const doubleBraceRegex = /{{(\d+|[a-z$_][\w\-$]*?(?:\.[\w\-$*]*?)*?)(:(int|bool|num|str|any|json))?(:(null))?}}/gi;

	if (doubleBraceRegex.test(template)) {
		const value = template.replace(doubleBraceRegex, composeHtmlEscape(replace));
		const matches = [...template.matchAll(doubleBraceRegex)];
		const type = matches[0] ? matches[0][3] : 'null';
		const useNull = matches[0] ? matches[0][5] : null;

		if (type === 'int') {
			return parseInt(value);
		}

		if (type === 'bool') {
			return Boolean(value);
		}

		if (type === 'num') {
			return Number(value);
		}

		if (type === 'json' && value !== 'undefined' && (typeof value === 'string' || value instanceof String)) {
			return JSON.parse(value);
		}

		if (useNull && value === 'undefined') {
			return null;
		}

		return value;
	}

// 	const braceRegex = /{(\d+|[a-z$_][\w\-$]*?(?:\.[\w\-$]*?)*?)}/gi;

// 	return template.replace(braceRegex, replace);
	return template;
}
