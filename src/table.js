// 参考了 {@link https://github.com/Automattic/cli-table cli-table}


/**
 *
 * @param {Array<Array|Object>} data - Double array object
 * @param {Object} [opts = {}] - table config
 *
 *   - head {Array}
 *   - lead {Array}
 *   - showHead  {Boolean} 是否显示表头，默认不显示，如果 opts 中指定了 head = []，则此值默认值自动更新为 true
 *   - showLead {Boolean}  是否显示表左侧的索引，和表头类似
 *   - showHeadOnBottom {Boolean}   是否将表头显示在最下面
 *   - showLeadOnRight {Boolean}   是否将表索引显示在最右边
 *   - chars  {Object}    参考 {@link https://github.com/Automattic/cli-table cli-table}
 *
 *   - rowFilter {Array|Function}
 *   - colFilter {Array|Function}
 *   - rowSort   {Array|Function}
 *   - colSort   {Array|Function}
 *
 *
 *   通用的样式:
 *      fg, color
 *      bg, background
 *      padding, paddingLeft, paddingRight ...
 *      overflow: wrap, ellipsis, 或者直接指定要使用的 ellipsis 字符串，行高都限制了此值才有可能生效
 *      align: left, center, right
 *
 *   row 级别的样式：
 *      height: auto; 同一行高度是一样的
 *
 *   col 级别的样式:
 *      width: auto; 同一列，宽度是一样的
 *
 *   # 注意样式设置是有优先级的 xx < xxOdd, xxEven < xxA < head, lead < cellAA
 *   - style: {
 *      row:
 *      col:
 *
 *      rowOdd
 *      rowEven
 *      rowA:
 *      rowB:
 *      .
 *      .
 *
 *      colOdd
 *      colEven
 *      colA:
 *      colB:
 *      .
 *      .
 *
 *      head:
 *      lead:
 *
 *      cellAA
 *      cellAB
 *      .
 *      .
 *   }
 *
 */
function table(data, opts = {}) {


}
