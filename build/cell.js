'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _wrap = require('./wrap');

var _wrap2 = _interopRequireDefault(_wrap);

var _helper = require('./helper');

var _helper2 = _interopRequireDefault(_helper);

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
  var opts = arguments[1] === undefined ? {} : arguments[1];

  // 参数 自动从 detected 中获取，如果设置了默认的，则无法从 detected 中获取
  // opts.tabsize = opts.tabsize || 8;
  // opts.ambsize = opts.ambsize || 1;

  // 检查并设置 left, right, width
  _helper2['default'].checkLRW(opts);

  // 生成新的配置项
  opts.prefix = _wrap2['default'].CSI + opts.left + 'C';

  return (0, _wrap2['default'])(text, opts);
}

exports['default'] = cell;
module.exports = exports['default'];