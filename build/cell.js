'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _wrap = require('./wrap');

var _wrap2 = _interopRequireDefault(_wrap);

var _ttySize = require('tty-size');

var _ttySize2 = _interopRequireDefault(_ttySize);

// 参数检查
function _cellOptsCheck(opts) {
  var winSize = (0, _ttySize2['default'])(); // 每次都重复计算，因为用户可以手动调整屏幕大小

  // 参数 自动从 detected 中获取，如果设置了默认的，则无法从 detected 中获取
  // opts.tabsize = opts.tabsize || 8;
  // opts.ambsize = opts.ambsize || 1;

  ['left', 'right', 'width'].forEach(function (k, i) {
    var v = opts[k];
    var intV = parseInt(v, 10);
    if (typeof v === 'string' && /^\d+%$/.test(v)) {
      opts[k] = Math.round(winSize.width * intV / 100);
    } else if (!isNaN(intV) && intV > 0) {
      opts[k] = intV;
    } else {
      opts[k] = i < 2 ? 0 : winSize.width - opts.left - opts.right;
    }
  });

  // 验证
  if (opts.left + opts.right + opts.width > winSize.width) throw new Error('left + right + width value should less or equal then ternimal\'s width.');

  // 生成新的配置项
  opts.prefix = _wrap2['default'].CSI + opts.left + 'C';
}

/**
 * Wrap Text
 *
 * @param {String} text - The text need to be wrapped
 * @param {Object} opts - Wrap options
 *
 *  - left
 *  - right
 *  - width
 *  - height
 *  - tabsize
 *  - ambsize
 *  - ellipsis
 *  - inheritColor
 *  - fill
 *
 *  WARN: left + right + width should less equal then ternimal's width
 *
 */
function cell(text) {
  var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  _cellOptsCheck(opts);
  return (0, _wrap2['default'])(text, opts);
}

exports['default'] = cell;
module.exports = exports['default'];