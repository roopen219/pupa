import test from 'ava';
import pupa, {MissingValueError} from './index.js';

test('main', t => {
	// Normal placeholder
	t.is(pupa('{foo}', {foo: '!'}), '{foo}');
	t.is(pupa('{foo}', {foo: 10}), '{foo}');
	t.is(pupa('{foo}', {foo: 0}), '{foo}');
	t.is(pupa('{fo-o}', {'fo-o': 0}), '{fo-o}');
	t.is(pupa('{foo}{foo}', {foo: '!'}), '{foo}{foo}');
	t.is(pupa('{foo}{bar}{foo}', {foo: '!', bar: '#'}), '{foo}{bar}{foo}');
	t.is(pupa('yo {foo} lol {bar} sup', {foo: '🦄', bar: '🌈'}), 'yo {foo} lol {bar} sup');

	t.is(pupa('{foo}{deeply.nested.valueFoo}', {
		foo: '!',
		deeply: {
			nested: {
				valueFoo: '#',
			},
		},
	}), '{foo}{deeply.nested.valueFoo}');

	t.is(pupa('{0}{1}', ['!', '#']), '{0}{1}');

	// Encoding HTML Entities to avoid code injection
	t.is(pupa('{{foo}}', {foo: '!'}), '!');
	t.is(pupa('{{foo}}', {foo: 10}), '10');
	t.is(pupa('{{foo}}', {foo: 0}), '0');
	t.is(pupa('{{foo}}{{foo}}', {foo: '!'}), '!!');
	t.is(pupa('{{foo:int}}', {foo: 1}), 1);
	t.is(pupa('{{foo:int}}', {foo: 1.432}), 1);
	t.is(pupa('{{foo:num}}', {foo: 1}), 1);
	t.is(pupa('{{foo:num}}', {foo: 1.432}), 1.432);
	t.is(pupa('{{foo:bool}}', {foo: false}), false);
	t.is(pupa('{{foo:bool}}', {foo: true}), true);
	t.deepEqual(pupa('{{foo:json}}', {foo: { a: 1 } }), { a: 1 });
	t.is(pupa('{{foo}}', {foo: { a: 1 } }), '{"a":1}');
	t.is(pupa('{foo}{{bar}}{foo}', {foo: '!', bar: '#'}), '{foo}#{foo}');
	t.is(pupa('yo {{foo}} lol {{bar}} sup', {foo: '🦄', bar: '🌈'}), 'yo 🦄 lol 🌈 sup');

	t.is(pupa('{foo}{{deeply.nested.valueFoo}}', {
		foo: '!',
		deeply: {
			nested: {
				valueFoo: '<br>#</br>',
			},
		},
	}), '{foo}<br>#</br>');

	t.is(pupa('{{0}}{{1}}', ['!', '#']), '!#');

	t.is(pupa('{{0}}{{1}}', ['<br>yo</br>', '<i>lol</i>']), '<br>yo</br><i>lol</i>');
});

test('do not match non-identifiers', t => {
	const fixture = '"*.{json,md,css,graphql,html}"';
	t.is(pupa(fixture, []), fixture);
});

test('ignore missing', t => {
	const template = 'foo{{bar}}{undefined}';
	const options = {ignoreMissing: true};
	t.is(pupa(template, {}, options), template);
	t.is(pupa('{{foo:json}}', {}, options), '{{foo:json}}');
	t.is(pupa('{{foo:int}}', {}, options), '{{foo:int}}');
	t.is(pupa('{{foo:num}}', {}, options), '{{foo:num}}');
	t.is(pupa('{{foo:bool}}', {}, options), '{{foo:bool}}');
});

test('return undefined by default', t => {
	t.is(pupa('{{foo}}', {}), 'undefined');
	t.is(pupa('{{foo:json}}', {}), 'undefined');
});

test('transform and ignore missing', t => {
	const options = {
		ignoreMissing: true,
		transform: ({value}) => Number.isNaN(Number.parseInt(value, 10)) ? undefined : value,
	};
	t.is(pupa('{{0}} {{1}} {{2}}', ['0', 42, 3.14], options), '0 42 3.14');
	t.is(pupa('{{0}} {{1}} {{2}}', ['0', null, 3.14], options), '0 {{1}} 3.14');
});

test('transform and throw on undefined', t => {
	const options = {
		transform: ({value}) => Number.isNaN(Number.parseInt(value, 10)) ? undefined : value,
	};

	t.notThrows(() => {
		pupa('{{0}} {{1}} {{2}}', ['0', 42, 3.14], options);
	});

	t.is(pupa('{{0}} {{1}} {{2}}', ['0', null, 3.14], options), '0 undefined 3.14');
});
