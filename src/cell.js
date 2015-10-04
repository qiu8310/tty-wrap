import wrap from './wrap';
import helper from './helper';

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

  // 参数 自动从 detected 中获取，如果设置了默认的，则无法从 detected 中获取
  // opts.tabsize = opts.tabsize || 8;
  // opts.ambsize = opts.ambsize || 1;

  // 检查并设置 left, right, width
  helper.checkLRW(opts);

  // 生成新的配置项
  opts.prefix = wrap.CSI + opts.left + 'C';


  return wrap(text, opts);
}

export default cell;

