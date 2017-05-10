import test from 'ava';
import shell from 'shelljs';
import m from './';

shell.config.silent = true;

test('mock and unmock git bla', async t => {
	const log = 'mocking git bla!';
	const unmock = await m(`console.log('${log}')`, 'bla');
	let actual = shell.exec('git bla').stdout;
	t.is(log + '\n', actual);

	actual = shell.exec('git').stdout;
	t.not(log + '\n', actual);

	unmock();
	actual = shell.exec('git bla').stdout;
	t.not(log + '\n', actual);
});

test('mock and unmock git --no-pager bla', async t => {
	const log = 'mocking git bla!';
	const unmock = await m(`console.log('${log}')`, 'bla');
	let actual = shell.exec('git --no-pager bla').stdout;
	t.is(log + '\n', actual);

	actual = shell.exec('git').stdout;
	t.not(log + '\n', actual);

	unmock();
	actual = shell.exec('git --no-pager bla').stdout;
	t.not(log + '\n', actual);
});

test('mocking bar does not affect foo', async t => {
	const fooLog = 'mocking foo!';
	await m(`console.log('${fooLog}')`, 'foo');

	const barLog = 'mocking bar!';
	await m(`console.log('${barLog}')`, 'bar');

	let barActual = shell.exec('git bar').stdout;
	t.is(barLog + '\n', barActual);

	barActual = shell.exec('git --no-pager bar').stdout;
	t.is(barLog + '\n', barActual);

	let fooActual = shell.exec('git foo').stdout;
	t.is(fooLog + '\n', fooActual);

	fooActual = shell.exec('git --no-pager foo').stdout;
	t.is(fooLog + '\n', fooActual);

	let stderr = shell.exec('git log').stderr;
	t.falsy(stderr);
});

test('mocking git', async t => {
	const log = 'mocking git!';
	const unmock = await m(`console.log('${log}')`);

	let actual = shell.exec('git');
	t.is(log + '\n', actual.stdout);
	t.falsy(actual.stderr);

	actual = shell.exec('git foo');
	t.is(log + '\n', actual.stdout);
	t.falsy(actual.stderr);

	actual = shell.exec('git --no-pager log');
	t.is(log + '\n', actual.stdout);
	t.falsy(actual.stderr);

	unmock();
	actual = shell.exec('git');
	t.not(log + '\n', actual.stdout);
	t.falsy(actual.stderr);
});

test('passing arguments while mocking only commit', async t => {
	const unmock = await m(`console.log(process.argv.splice(2).join(' '));`, 'commit');
	const args = 'commit --obviously-invalid-arg -m "second commit with spaces!"';

	const actual = shell.exec(`git ${args}`);
	t.falsy(actual.stderr);
	t.is(`${args.replace(new RegExp('"', 'g'), '')}\n`, actual.stdout);

	unmock();
});

test('passing arguments while mocking whole git', async t => {
	const unmock = await m(`console.log(process.argv.splice(2).join(' '));`);
	const args = 'commit --obviously-invalid-arg -m "third commit with spaces!"';

	const actual = shell.exec(`git ${args}`);
	t.falsy(actual.stderr);
	t.is(`${args.replace(new RegExp('"', 'g'), '')}\n`, actual.stdout);

	unmock();
});

test('passing through exit code', async t => {
	const unmock = await m('process.exitCode = 1');
	const args = 'foo';

	const actual = shell.exec(`git ${args}`);
	t.is(1, actual.code);

	unmock();
});

test('passing through exit code with multiple mocks', async t => {
	const unmock = [await m('process.exitCode = 1', 'one'), await m('process.exitCode = 2', 'two')];

	t.is(1, shell.exec(`git one`).code);
	t.is(2, shell.exec(`git two`).code);

	unmock[0]();
	unmock[1]();
});
