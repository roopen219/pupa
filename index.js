import {htmlEscape} from 'escape-goat';

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
		let value = data;
		const splitKey = key.split(':');
		let _key;
		let _type;
		if (splitKey.length > 1) {
			_key = splitKey[0];
			_type = splitKey[1];
		} else {
			_key = key;
		}
		for (const property of _key.split('.')) {
			value = value ? value[property] : undefined;
		}

		const transformedValue = transform({value, key});
		if (transformedValue === undefined) {
			if (ignoreMissing) {
				return placeholder;
			}

			throw new MissingValueError(key);
		}

		if (_type === 'int') {
			return parseInt(transformedValue);
		}

		if (_type === 'bool') {
			return Boolean(transformedValue);
		}

		if (_type === 'num') {
			return Number(transformedValue);
		}

		return String(transformedValue);
	};

	const composeHtmlEscape = replacer => (...args) => htmlEscape(replacer(...args));

	// The regex tries to match either a number inside `{{ }}` or a valid JS identifier or key path.
	const doubleBraceRegex = /{{(\d+|[a-z$_][\w\-$]*?(?:\.[\w\-$]*?)*?)(:(int|bool|num))?}}/gi;

	if (doubleBraceRegex.test(template)) {
		return template.replace(doubleBraceRegex, composeHtmlEscape(replace));
	}

// 	const braceRegex = /{(\d+|[a-z$_][\w\-$]*?(?:\.[\w\-$]*?)*?)}/gi;

// 	return template.replace(braceRegex, replace);
	return template;
}
