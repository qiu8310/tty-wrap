'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _ttyText = require('tty-text');

var _ttyText2 = _interopRequireDefault(_ttyText);

var _punycode = require('punycode');

var _punycode2 = _interopRequireDefault(_punycode);

var _detectSize = require('./detectSize');

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

require('es6-shim');

var EOL = _os2['default'].EOL;

// Refer from `ansi-regex` npm package
var ANSI_REGEXP = /[\u001b\u009b]([[()#;?]*)([0-9]{1,4}(?:;[0-9]{0,4})*)?([0-9A-ORZcf-nqry=><])/g;

// ANSI ESCAPE CODE
// Refer: https://en.wikipedia.org/wiki/ANSI_escape_code
var ESC = '\x1B';
var CSI = ESC + '[';
var REST_SRG = CSI + 'm';

function codePointSize(codePoint, opts) {
  // 9 => \t, 11 => \v, 12 => \f, 10 => \n, 13 => \r (10 和 13 是不会出现的)
  if (codePoint === 9) return opts.tabsize;
  if (codePoint === 11 || codePoint === 12) return opts.width + 2; // 保证会触发换行就行了

  return _ttyText2['default'].codePointSize(codePoint, opts.ambsize);
}

var Ansi = (function () {
  function Ansi(code, privateChars, paramaters, trailingChar, index) {
    if (privateChars === undefined) privateChars = '';
    if (paramaters === undefined) paramaters = '';
    if (trailingChar === undefined) trailingChar = '';

    _classCallCheck(this, Ansi);

    this.code = code;
    this.privateChars = privateChars;

    // 如果存在的话， 去掉最后一个多余的 ';'
    if (paramaters[paramaters.length - 1] === ';') paramaters = paramaters.slice(0, -1);
    this.paramaters = paramaters.split(';');

    this.trailingChar = trailingChar;
    this.index = index;
  }

  _createClass(Ansi, [{
    key: 'isColorAnsi',
    value: function isColorAnsi() {
      return this.trailingChar === 'm';
    }
  }]);

  return Ansi;
})();

var Char = function Char(codePoint, index, opts) {
  _classCallCheck(this, Char);

  this.codePoint = codePoint;
  this.size = codePointSize(codePoint, opts);
  this.symbol = _punycode2['default'].ucs2.encode([codePoint]);
  this.index = index;
};

var Row = (function () {
  function Row(str, ansis, opts) {
    _classCallCheck(this, Row);

    this.str = str;
    this.ansis = ansis;

    var diff = 0;
    this.chars = _punycode2['default'].ucs2.decode(str).map(function (codePoint, index) {
      index += diff; // 保留非 unicode 时的索引，用于恢复之前的 ansi 字符
      diff += _ttyText2['default'].isSurrogatePairsChar(codePoint) ? 1 : 0;
      return new Char(codePoint, index, opts);
    });
  }

  _createClass(Row, [{
    key: '_getAnsisAt',
    value: function _getAnsisAt(index, isLast) {
      return this.ansis.filter(function (ansi) {
        return ansi.index === index + (isLast ? 1 : 0);
      }).map(function (ansi) {
        return ansi.code;
      }).join('');
    }
  }, {
    key: '_getColorAnsisBefore',
    value: function _getColorAnsisBefore(index) {
      return this.ansis.filter(function (ansi) {
        return ansi.index <= index && ansi.isColorAnsi();
      }).map(function (ansi) {
        return ansi.code;
      }).join('');
    }
  }, {
    key: 'getEndColor',
    value: function getEndColor() {
      return this._getColorAnsisBefore(Infinity);
    }
  }, {
    key: 'merge',
    value: function merge(opts) {
      var _this = this;

      var rows = [],
          row = undefined,
          c = undefined;
      var height = opts.height;
      var createRow = function createRow() {
        var startColor = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
        var prefix = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

        height--;
        var r = { str: ' '.repeat(prefix), startColor: startColor, size: prefix };
        rows.push(r);
        return r;
      };

      // 恢复 ansi 的 code
      var recoverAnsi = function recoverAnsi(c, isLast) {
        return row.str += _this._getAnsisAt(c.index, isLast);
      };

      if (!height) return [];
      row = createRow();

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.chars[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          c = _step.value;

          var symbol = c.symbol;

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

            var leftSize = opts.width - row.size;
            if (height === 0) leftSize -= opts.ellipsisSize; // 最后一行，要加上后缀

            if (c.size <= leftSize) {
              // 剩下的空间完全可以容下当前字符
              recoverAnsi(c);
              row.size += c.size;

              if (symbol === '\t') {
                row.str += ' '.repeat(c.size);
              } else {
                row.str += symbol;
              }
            } else {
              // 剩下的空间不足以容下当前字符

              var prefix = 0;
              if (symbol === '\t' && leftSize !== 0) {
                // 最后一个字符是 \t，则凑合用就行，不用换行
                recoverAnsi(c);
                row.str += ' '.repeat(leftSize);
                row.size += leftSize;
              } else {

                if (symbol === '\t' && leftSize === 0) {
                  // \t 在行首
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
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator['return']) {
            _iterator['return']();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      if (row && c) recoverAnsi(c, true);

      return rows;
    }
  }]);

  return Row;
})();

var Block = (function () {
  function Block(text, opts) {
    _classCallCheck(this, Block);

    this.rows = text.split(/[\r]?\n/).map(function (str) {
      var ansis = [],
          diff = 0;

      str = str.replace(ANSI_REGEXP, function (code, privateChars, paramaters, trailingChar, index) {
        index -= diff; // 去掉了 ANSI 值后的索引
        diff += code.length;
        ansis.push(new Ansi(code, privateChars, paramaters, trailingChar, index));
        return '';
      });

      return new Row(str, ansis, opts);
    });
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

  _createClass(Block, [{
    key: 'wrap',
    value: function wrap(opts) {
      var _this2 = this;

      var all = [],
          rows = undefined,
          merged = undefined,
          text = '',
          width = 0,
          height = 0,
          lastWidth = 0;
      var each = function each(fn) {
        all.forEach(function (merged, i) {
          merged.forEach(function (row, j) {
            return fn(row, i, j);
          });
        });
      };

      for (var i = 0; i < this.rows.length; i++) {
        merged = this.rows[i].merge(opts);
        opts.height -= merged.length;
        all.push(merged);
        if (opts.height <= 0) break;
      }

      // 计算宽度 和 高度
      rows = [];
      each(function (row) {
        height++;
        if (row.size > width) width = row.size;
        lastWidth = row.size;
        rows.push(row);
      });

      // 填充空白区域
      if (opts.fill) {
        (function () {
          var maxWidth = isFinite(opts.width) ? opts.width : width;
          each(function (row) {
            row.str += ' '.repeat(maxWidth - row.size);
          });
        })();
      }

      // 组合
      each(function (row, i, j) {
        text += i || j ? EOL : '';
        text += opts.prefix + REST_SRG + (opts.inheritColor && i ? _this2.rows[i - 1].getEndColor() : '') + row.startColor + row.str + REST_SRG;
      });

      return { text: text, width: width, height: height, lastWidth: lastWidth, rows: rows };
    }
  }]);

  return Block;
})();

function wrap(text) {
  var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  opts.width = opts.width || Infinity;
  opts.height = opts.height || Infinity;
  opts.ellipsis = opts.ellipsis || ' ...';
  opts.prefix = opts.prefix || '';
  opts.tabsize = opts.tabsize || _detectSize.detected.tabsize || 8;
  opts.ambsize = opts.ambsize || _detectSize.detected.ambsize || 1;
  if (opts.ambsize !== 2) opts.ambsize = 1; // 只能是 2 和 1
  opts.ellipsisSize = _ttyText2['default'].size(opts.ellipsis, opts.ambsize);

  var block = new Block(text, opts);
  return block.wrap(opts);
}

wrap.ANSI_REGEXP = ANSI_REGEXP;
wrap.REST_SRG = REST_SRG;
wrap.CSI = CSI;
wrap.ESC = ESC;

exports['default'] = wrap;
module.exports = exports['default'];