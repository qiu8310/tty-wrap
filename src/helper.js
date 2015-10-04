import ttySize from 'tty-size';

// 参数 left, right, width 检查
// 确保它们之和小于屏幕
// 只要指定了 right 或者 width 都会触发 wrap，否则不 wrap
function checkLRW(opts) {
  let winSize = ttySize(); // 每次都重复计算，因为用户可以手动调整屏幕大小
  let rightInOpts = 'right' in opts; // 备份下

  ['left', 'right', 'width'].forEach((k, i) => {
    let v = opts[k];
    let intV = parseInt(v, 10);
    if (typeof v === 'string' && /^\d+%$/.test(v)) {
      opts[k] = Math.round(winSize.width * intV / 100);
    } else if (!isNaN(intV) && intV > 0) {
      opts[k] = intV;
    } else {
      opts[k] = i < 2 ? 0 : (rightInOpts ? winSize.width - opts.left - opts.right : 0 );
    }
  });

  // 验证
  if (opts.left + opts.right + opts.width > winSize.width)
    throw new Error('left + right + width value should less or equal then ternimal\'s width.');

}



export default { checkLRW };
