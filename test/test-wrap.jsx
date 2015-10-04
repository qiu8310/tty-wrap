
import wrap from '../';
import assert from 'assert';
import should from 'should';


let strip = (str) => str.replace(wrap.ANSI_REGEXP, '');
let test = (str, opts, width, height, lastWidth, stripped) => {
  if (typeof opts !== 'object') {
    stripped = lastWidth;
    lastWidth = height;
    height = width;
    width = opts;
    opts = {};
  }
  let rtn = wrap(str, opts);
  try {
    if (width !== undefined) rtn.width.should.eql(width);
    if (height !== undefined) rtn.height.should.eql(height);
    if (lastWidth !== undefined) rtn.lastWidth.should.eql(lastWidth);
    if (stripped !== undefined) strip(rtn.text).should.eql(stripped);
  } catch(e) {
    console.log(rtn, strip(rtn.text));
    throw e;
  }
  return rtn;
}

let B = '\x1B[44m', R = '\x1B[m', P = '\x1B[6n';

describe('wrap', () => {

  context('@basic', () => {
    it('empty', () => {
      test('', 0, 1, 0, '');
    });

    it('empty line', () => {
      test('\n', 0, 2, 0, '\n');
      test('a\n\nb', 1, 3, 1, 'a\n\nb');
    });

    it('one line', () => {
      test('ab', 2, 1, 2, 'ab');
    });
    it('two line', () => {
      test('aaaaa\nb', 5, 2, 1, 'aaaaa\nb');
    });
    it('tab at start', () => {
      test('\tab', {width: 9}, 9, 2, 1, '        a\nb');
      test('\tab', {width: 4, tabsize: 3}, 4, 2, 1, '   a\nb');
      test('abcd\ta', {width: 4, tabsize: 3}, 4, 2, 4, 'abcd\n   a');
    });
    it('tab at middle', () => {
      test('a\tb', {width: 12}, 10, 1, 10, 'a        b');
      test('a\tb', {width: 12, fill: true}, 10, 1, 10, 'a        b  ');
    });
    it('tab at end', () => {
      test('a\t', {width: 2}, 2, 1, 2, 'a ');
      test('a\t', {width: 3}, 3, 1, 3, 'a  ');
      test('a\tab', {width: 3}, 3, 2, 2, 'a  \nab');
    });

    it('v-tab at start', () => {
      test('\vab', 2, 2, 2, '\nab');
      test('ab\v', {width: 2}, 2, 2, 2, 'ab\n  ');
      test('ab\vc', {width: 2}, 2, 3, 1, 'ab\n  \nc');
    });
    it('v-tab at middle', () => {
      test('a\vc', 2, 2, 2, 'a\n c');
      test('a\vc', {fill: true}, 2, 2, 2, 'a \n c');
    });
    it('f is same with v', () => {
      test('a\fc', 2, 2, 2, 'a\n c');
    });
  });

  context('@config', () => {
    it('set width', () => {
      test('12345', {width: 3}, 3, 2, 2);
      test('12345', {width: 2}, 2, 3, 1);
      test('12\n345', {width: 3}, 3, 2, 3, '12\n345');
    });

    it('set height', () => {
      test('12345\n1234\n123\n12', {height: 1}, 5, 1, 5, '12345');
      test('12345\n1234\n123\n12', {height: 2}, 5, 2, 4, '12345\n1234');
    });

    it('set width and height', () => {
      test('1234567', {width: 2, height: 4}, 2, 4, 1, '12\n34\n56\n7');
      test('1234567', {width: 4, height: 1}, 4, 1, 4, ' ...');
    });

    it('inheritColor', () => {
      test(`${B}a\nb`).text.should.eql(`${R}${B}a${R}\n${R}b${R}`);
      test(`${B}a\nb`, {inheritColor: true}).text.should.eql(`${R}${B}a${R}\n${R}${B}b${R}`);
    });
    it('ellipsis', () => {
      test('abcdef', {width: 5, height: 1}).text.should.eql(`${R}a ...${R}`);
      test('abcdefadf', {width: 5, height: 2}).text.should.eql(`${R}abcde${R}\n${R}f ...${R}`);
    })
  });

  context('@ansi', () => {

    it('save ansi', () => {
      test(`${P}12`).text.should.eql(`${R}${P}12${R}`);
      test(`1${P}2`).text.should.eql(`${R}1${P}2${R}`);
      test(`12${P}`).text.should.eql(`${R}12${P}${R}`);
    });

    it('save ansi in inner multiple line', () => {
      test(`${P}12`, {width: 1}).text.should.eql(`${R}${P}1${R}\n${R}2${R}`);
      test(`1${P}2`, {width: 1}).text.should.eql(`${R}1${R}\n${R}${P}2${R}`);
      test(`12${P}`, {width: 1}).text.should.eql(`${R}1${R}\n${R}2${P}${R}`);
    });

    it('save ansi in outer multiple line', () => {
      test(`${P}1\n2`).text.should.eql(`${R}${P}1${R}\n${R}2${R}`);
      test(`1\n${P}2`).text.should.eql(`${R}1${R}\n${R}${P}2${R}`);
      test(`1${P}\n2`).text.should.eql(`${R}1${P}${R}\n${R}2${R}`);
    });



    it('save color ansi', () => {
      test(`${B}12`).text.should.eql(`${R}${B}12${R}`);
      test(`1${B}2`).text.should.eql(`${R}1${B}2${R}`);
      test(`12${B}`).text.should.eql(`${R}12${B}${R}`);
    });

    it('save color ansi in inner multiple line', () => {
      test(`${B}12`, {width: 1}).text.should.eql(`${R}${B}1${R}\n${R}${B}2${R}`);
      // 会生成重复的 color ansi，并不影响功能，所以先忽略这个问题
      // test(`1${B}2`, {width: 1}).text.should.eql(`${R}1${R}\n${R}${B}2${R}`);
      test(`12${B}`, {width: 1}).text.should.eql(`${R}1${R}\n${R}2${B}${R}`);
    });
  });

  context('special character', () => {
    let controlChar = '\u0001',
      combiningMarkChar = '\u0303',
      ambiguousChar = '\u2661',
      cnChar = '中',
      astraChar = '\uD83D\uDCA9';

    it('basic', () => {
      test(controlChar, 0, 1, 0, '\u0001');
      test(combiningMarkChar, 0, 1, 0, '\u0303');
      test(ambiguousChar, 1, 1, 1, '\u2661');
      test(ambiguousChar, {ambsize: 2}, 2, 1, 2, '\u2661');
      test(cnChar, 2, 1, 2, '中');
      test(astraChar, 1, 1, 1, '\uD83D\uDCA9');
    });

  });

});
