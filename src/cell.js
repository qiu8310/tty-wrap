import wrap from './wrap';

import ttySize from 'tty-size';

// 参数检查
function _cellOptsCheck(opts) {
  let winSize = ttySize(); // 每次都重复计算，因为用户可以手动调整屏幕大小

  // 参数
  opts.tabsize = opts.tabsize || 8;
  opts.ambsize = opts.ambsize || 1;

  ['left', 'right', 'width'].forEach((k, i) => {
    let v = opts[k];
    let intV = parseInt(v, 10);
    if (typeof v === 'string' && /^\d+%$/.test(v)) {
      opts[k] = Math.round(winSize.width * intV / 100);
    } else if (!isNaN(intV) && intV > 0) {
      opts[k] = intV;
    } else {
      opts[k] = i < 2 ? 0 : winSize.width - opts.left - opts.right;
    }
  });

  // 验证
  if (opts.left + opts.right + opts.width > winSize.width)
    throw new Error('left + right + width value should less or equal then ternimal\'s width.');

  // 生成新的配置项
  opts.prefix = wrap.CSI + opts.left + 'C';
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
function cell(text, opts = {}) {

  _cellOptsCheck(opts);
  return wrap(text, opts);
}

wrap.cell = cell;

export default wrap;

