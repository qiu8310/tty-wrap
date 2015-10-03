import ttyText from 'tty-text';
import punycode from 'punycode';

import os from 'os';

const EOL = os.EOL;

// Refer from `ansi-regex` npm package
const ANSI_REGEXP = /[\u001b\u009b]([[()#;?]*)([0-9]{1,4}(?:;[0-9]{0,4})*)?([0-9A-ORZcf-nqry=><])/g;


// ANSI ESCAPE CODE
// Refer: https://en.wikipedia.org/wiki/ANSI_escape_code
const ESC = '\x1B';
const CSI = ESC + '[';
const REST_SRG = CSI + 'm';


function codePointSize(codePoint, opts) {
  // 9 => \t, 11 => \v, 12 => \f, 10 => \n, 13 => \r (10 和 13 是不会出现的)
  if (codePoint === 9) return opts.tabsize;
  if (codePoint === 11 || codePoint === 12) return opts.width + 2; // 保证会触发换行就行了

  return ttyText.codePointSize(codePoint, opts.ambsize);
}

class Ansi {
  constructor(code, privateChars = '', paramaters = '', trailingChar = '', index) {
    this.code = code;
    this.privateChars = privateChars;

    // 如果存在的话， 去掉最后一个多余的 ';'
    if (paramaters[paramaters.length - 1] === ';') paramaters = paramaters.slice(0, -1);
    this.paramaters = paramaters.split(';')

    this.trailingChar = trailingChar;
    this.index = index;
  }

  isColorAnsi() { return this.trailingChar === 'm'; }
}

class Char {
  constructor(codePoint, index, opts) {
    this.codePoint = codePoint;
    this.size = codePointSize(codePoint, opts);
    this.symbol = punycode.ucs2.encode([codePoint]);
    this.index = index;
  }
}

class Row {
  constructor(str, ansis, opts) {
    this.str = str;
    this.ansis = ansis;

    let diff = 0;
    this.chars = punycode.ucs2.decode(str).map((codePoint, index) => {
      index += diff; // 保留非 unicode 时的索引，用于恢复之前的 ansi 字符
      diff += ttyText.isSurrogatePairsChar(codePoint) ? 1 : 0;
      return new Char(codePoint, index, opts);
    });
  }

  _getAnsisAt(index, isLast) {
    return this.ansis.filter(ansi => ansi.index === index + (isLast ? 1 : 0)).map(ansi => ansi.code).join('');
  }
  _getColorAnsisBefore(index) {
    return this.ansis.filter(ansi => ansi.index <= index && ansi.isColorAnsi()).map(ansi => ansi.code).join('');
  }

  getEndColor() {
    return this._getColorAnsisBefore(Infinity);
  }

  merge(opts) {
    let rows = [], row, c;
    let height = opts.height;
    let createRow = (startColor = '', prefix = 0) => {
      height--;
      let r = {str: ' '.repeat(prefix), startColor, size: prefix};
      rows.push(r);
      return r;
    };

    // 恢复 ansi 的 code
    let recoverAnsi = (c, isLast) => row.str += this._getAnsisAt(c.index, isLast);

    if (!height) return [];
    row = createRow();

    for (c of this.chars) {
      let symbol = c.symbol;

      // 特殊字符特殊处理
      if (symbol === '\v' || symbol === '\f') {
        recoverAnsi(c);

        if (height) {
          // @NOTE 这里不要填充内容
          row = createRow(this._getColorAnsisBefore(c.index), row.size);
        } else {
          // @FIXME 如果 \v 或 \f 正好出现的一行的最后，这里再加上这个 ellipsis 就 overflow 了
          row.str += opts.ellipsis;
          row.size += opts.ellipsisSize;
          break;
        }

      } else {

        let leftSize = opts.width - row.size;
        if (height === 0) leftSize -= opts.ellipsisSize; // 最后一行，要加上后缀

        if (c.size <= leftSize) { // 剩下的空间完全可以容下当前字符
          recoverAnsi(c);
          row.size += c.size;

          if (symbol === '\t') {
            row.str += ' '.repeat(c.size);
          } else {
            row.str += symbol;
          }
        } else { // 剩下的空间不足以容下当前字符

          let prefix = 0;
          if (symbol === '\t' && leftSize !== 0) { // 最后一个字符是 \t，则凑合用就行，不用换行
            recoverAnsi(c);
            row.str += ' '.repeat(leftSize);
            row.size += leftSize;
          } else {

            if (symbol === '\t' && leftSize === 0) { // \t 在行首
              prefix = Math.min(opts.width, c.size);
            } else {
              row.str += ' '.repeat(leftSize);
              row.size += leftSize;
            }

            if (height) {
              row = createRow(this._getColorAnsisBefore(c.index), prefix);
              recoverAnsi(c);
              if (symbol !== '\t') {
                row.str += symbol;
                row.size += c.size;
              }
              row.size = Math.min(opts.width, row.size);
            } else {
              row.str += opts.ellipsis;
              row.size += opts.ellipsisSize;
              break;
            }
          }
        }
      }
    }

    // 最后一个字符的未尾也要恢复颜色
    if (row && c) recoverAnsi(c, true);

    return rows;
  }
}

class Block {
  constructor(text, opts) {
    this.rows = text.split(/[\r]?\n/).map(str => {
      let ansis = [], diff = 0;

      str = str.replace(ANSI_REGEXP, (code, privateChars, paramaters, trailingChar, index) => {
        index -= diff;  // 去掉了 ANSI 值后的索引
        diff += code.length;
        ansis.push(new Ansi(code, privateChars, paramaters, trailingChar, index));
        return '';
      });

      return new Row(str, ansis, opts);
    });
  }

  wrap(opts) {
    let all = [], rows, merged, text = '', width = 0, height = 0, lastWidth = 0;
    let each = (fn) => {
      all.forEach((merged, i) => {
        merged.forEach((row, j) => fn(row, i, j));
      });
    };

    for (let i = 0; i < this.rows.length; i++) {
      merged = this.rows[i].merge(opts);
      opts.height -= merged.length;
      all.push(merged);
      if (opts.height <= 0) break;
    }

    // 计算宽度 和 高度
    rows = [];
    each(row => {
      height++;
      if (row.size > width) width = row.size;
      lastWidth = row.size;
      rows.push(row);
    });

    // 填充空白区域
    if (opts.fill) {
      let maxWidth = isFinite(opts.width) ? opts.width : width;
      each(row => {
        row.str += ' '.repeat(maxWidth - row.size);
      });
    }

    // 组合
    each((row, i, j) => {
      text += (i || j) ? EOL : '';
      text += opts.prefix + REST_SRG
        + (opts.inheritColor && i ? this.rows[i - 1].getEndColor() : '')
        + row.startColor + row.str + REST_SRG;
    });

    return {text, width, height, lastWidth, rows};
  }
}



/**
 *
 * @param {String} text 要 wrap 的文本
 * @param {Object} opts 配置选项
 *
 *    - width         {Number}  限制字符串宽度（默认为 0， 不限制）
 *    - height        {Number}  限制字符串的高度（默认为 0，不限制）
 *    - tabsize       {Number}  指定 \t 的大小，（默认是 8）
 *    - ambsize       {Number}  指定 ambiguous character width ，（默认是 1，可选值是 1、2）
 *    - prefix        {prefix}  在每行添加一个前缀
 *    - fill          {Boolean} 是否要填平空白的区域
 *    - inheritColor  {Boolean} 是否要继承上一行的颜色
 *    - ellipsis      {String}  如果超出了宽度和高度就在最后加上此字段（默认为 ' ...'）
 *
 * @return {{text:String, col:Number, row:Number}}
 */
function wrap(text, opts = {}) {
  opts.width = opts.width || Infinity;
  opts.height = opts.height || Infinity;
  opts.ellipsis = opts.ellipsis || ' ...';
  opts.prefix = opts.prefix || '';
  opts.tabsize = opts.tabsize || 8;
  opts.ambsize = opts.ambsize === 2 ? 2 : 1;
  opts.ellipsisSize = ttyText.size(opts.ellipsis, opts.ambsize);

  let block = new Block(text, opts);
  return block.wrap(opts);
}


wrap.ANSI_REGEXP = ANSI_REGEXP;
wrap.REST_SRG = REST_SRG;
wrap.CSI = CSI;
wrap.ESC = ESC;

export default wrap;





