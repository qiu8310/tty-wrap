/*eslint no-loop-func: 0*/

import wrap from './wrap';
import helper from './helper';
import chalk from 'chalk';
import os from 'os';


let defaultStyles = {
  color: '',
  ellipsis: ' ...',
  align: 'left',
  vertical: 'top',
  width: 0,
  height: 0,
  padding: '0 1',
  paddingLeft: '',
  paddingTop: '',
  paddingRight: '',
  paddingBottom: ''
};

// 参考了 {@link https://github.com/Automattic/cli-table cli-table}
let simple = {
  topLeft: '⌌', top: '-', topMid: '-', topRight: '⌍',
  left: '|', leftMid: '|', hMid: '-', vMid: '|', hvMid: '+', right: '|', rightMid: '|',
  bottomLeft: '⌎', bottom: '-', bottomMid: '-', bottomRight: '⌏'
};
let single = {
  topLeft: '┌', top: '─', topMid: '┬', topRight: '┐',
  left: '╎', leftMid: '├', hMid: '─', vMid: '╎', hvMid: '┼', right: '╎', rightMid: '┤',
  bottomLeft: '└', bottom: '─', bottomMid: '┴', bottomRight: '┘'
};
let double = {
  topLeft: '╔', top: '═', topMid: '╦', topRight: '╗',
  left: '║', leftMid: '╠', hMid: '═', vMid: '║', hvMid: '╬', right: '║', rightMid: '╣',
  bottomLeft: '╚', bottom: '═', bottomMid: '╩', bottomRight: '╝'
};


let defaultChars = {simple, single, double};

// 解析 padding ，使它可以像设置 css 一样设置 四个方向上的值
function _d4(padding, s) {
  if (!Array.isArray(padding)) padding = padding.toString().trim().split(/\s+/);
  padding = padding.map(Number);
  let len = padding.length;
  let top = padding[0];
  let right = len === 1 ? top : padding[1];
  let bottom = len <= 2 ? top : padding[2];
  let left = len <= 3 ? right : padding[3];
  if (s.paddingTop) top = Number(s.paddingTop);
  if (s.paddingLeft) left = Number(s.paddingLeft);
  if (s.paddingRight) right = Number(s.paddingRight);
  if (s.paddingBottom) bottom = Number(s.paddingBottom);
  return {top, right, bottom, left};
}

function _cap(str) {
  return str[0].toUpperCase() + str.slice(1);
}

function _checkBorder(opts) {
  let chars = defaultChars.simple;
  opts.borderColor = opts.borderColor || 'gray';

  let border = opts.border;
  if (border) {
    if (typeof border === 'string' && defaultChars[border]) {
      chars = defaultChars[border];
    } else if (typeof border === 'object') {
      Object.keys(border).forEach(k => {
        chars[k] = border[k];
      });
    }

    Object.keys(chars).forEach(k => {
      chars[k] = chars[k] ? _applyColor(opts.borderColor, chars[k]) : '';
    });
    opts.chars = chars;

  }
}

function _applyFilter(filter, rows) {
  if (Array.isArray(filter)) {
    // 确保它是字符串
    filter = filter.map(f => f.toString());
    rows = rows.filter(row => filter.includes(row.label));
  } else if (typeof filter === 'function') {
    rows = rows.filter(filter);
  }
  return rows;
}

function _applySort(sort, rows) {
  if (Array.isArray(sort)) {
    return sort.map(n => rows.find(r => r.label === n.toString())).filter(n => n);
  } else if (typeof sort === 'function') rows.sort(sort);
  return rows;
}

// 生成表格用的 data
function _makeTableData(data, opts) {
  let {head, lead, rowFilter, colFilter, rowSort, colSort, leadHead = ''} = opts;

  let leadKeys = Object.keys(data);

  if (lead && lead.length) {
    if (!('showLead' in opts)) opts.showLead = true;
  } else {
    lead = leadKeys;
  }

  let rows = leadKeys.map((k, i) => { return {label: lead[i], data: data[k]}; });
  if (rowFilter) rows = _applyFilter(rowFilter, rows);
  if (rowSort) rows = _applySort(rowSort, rows);
  lead = rows.map(r => r.label);
  opts.lead = lead;

  let headKeys = leadKeys.length ? Object.keys(data[leadKeys[0]]) : [];
  if (head && head.length) {
    if (!('showHead' in opts)) opts.showHead = true;
  } else {
    head = headKeys;
  }

  let cols = headKeys.map((k, i) => { return {label: head[i], data: rows.map(row => row.data[k])}; });

  if (colFilter) cols = _applyFilter(colFilter, cols);
  if (colSort) cols = _applySort(colSort, cols);
  head = cols.map(c => c.label);
  opts.head = head;

  data = [];

  cols.forEach((col, i) => {
    col.data.forEach((val, j) => {
      if (!data[j]) data[j] = [];
      data[j][i] = val;
    });
  });


  if (opts.showLead) {
    let method = opts.showLeadOnRight ? 'push' : 'unshift';
    data.forEach((row, i) => row[method](lead[i]));
    head[method](leadHead);
  }
  if (opts.showHead) {
    let method = opts.showHeadOnBottom ? 'push' : 'unshift';
    data[method](head);
    lead[method](leadHead);
  }

  return data;
}

function _getCommonStyle(style) {
  let common = {};
  Object.keys(defaultStyles).forEach(k => {
    common[k] = style[k] || defaultStyles[k];
  });
  return common;
}

/**
 * cell/row/col
 * dataCell/dataRow/dataCol
 * oddRow/evenRow/oddCol/evenCol
 * rowA/rowB.../colA/colB...
 * rowLastA/rowLastB.../colLastA/colLastB...
 * row1/row2/...colUser/colAge/colDesc...
 * head/lead
 * cellAB/cellLastAB/cellALastB/cellLastALastB/...
 */
function _caculateCellStyle(i, j, val, rowCount, colCount, opts, common, style) {
  let isOddRow = i % 2, isOddCol = j % 2;
  let isLastRow = i === rowCount - 1, isLastCol = j === colCount - 1;
  let isHead = opts.showHead ? (opts.showHeadOnBottom ? isLastRow : i === 0) : false;
  let isLead = opts.showLead ? (opts.showLeadOnRight ? isLastCol : j === 0) : false;
  let rowAlpha = String.fromCharCode(i + 65), colAlpha = String.fromCharCode(j + 65);
  let rowLastAlpah = 'Last' + String.fromCharCode(64 + rowCount - i),
    colLastAplha = 'Last' + String.fromCharCode(64 + colCount - j);

  let styles = ['cell', 'row', 'col'];
  if (!isHead && !isLead) styles.push('dataCell', 'dataRow', 'dataCol');

  styles.push(
    isOddRow ? 'oddRow' : 'evenRow', isOddCol ? 'oddCol' : 'evenCol',
    'row' + rowAlpha, 'col' + colAlpha,
    'row' + rowLastAlpah, 'col' + colLastAplha
  );

  let leadKey = opts.lead[i].toString();
  let headKey = opts.head[j].toString();

  if (leadKey) styles.push('row' + _cap(leadKey));
  if (headKey) styles.push('col' + _cap(headKey));

  styles.push(
    isHead && 'head', isLead && 'lead',
    'cell' + rowAlpha + colAlpha, 'cell' + rowLastAlpah + colAlpha, 'cell' + rowAlpha + colLastAplha,
    'cell' + rowLastAlpah + colLastAplha
  );
  styles = styles.filter(k => k && style[k]).map(k => style[k]);

  let s = _getCommonStyle(Object.assign({}, common, ...styles));

  s.padding = _d4(s.padding, s);

  return s;
}


function _caculateTableStyle(data, opts, style) {
  let rowCount = data.length;
  let colCount = rowCount ? data[0].length : 0;
  let result = [], row;
  let common = _getCommonStyle(style);
  for (let i = 0; i < rowCount; i++) {
    row = [];
    for (let j = 0; j < colCount; j++) {
      row.push(_caculateCellStyle(i, j, data[i][j], rowCount, colCount, opts, common, style));
    }
    result.push(row);
  }
  return result;
}



function _applyColor(colors, val) {
  if (!colors) return val;
  let ref = chalk;
  colors.split('.').forEach(c => ref = ref[c] || ref);
  return ref(val);
}


// 计算表格每个单元的带样式的内容
function _caculateTableContent(data, style, maxRowHeights, maxColWidths, opts) {
  // 如果限制了宽度
  let autoWrapOnCol, columns = data[0] && data[0].length || 0;
  if (opts.width) {
    if (opts.autoWrapOnCol) autoWrapOnCol = opts.autoWrapOnCol.toUpperCase().charCodeAt(0) - 65;
    else autoWrapOnCol = columns - 1;
  }

  let max = (i, j, width) => {
    let s = style[i][j];

    // 取出 ellipsis tabsize width 值传入 wrap
    let wrapOpts = {ellipsis: s.ellipsis, tabsize: s.tabsize, width: width || s.width};

    let c = wrap(data[i][j] == null ? '' : data[i][j].toString(), wrapOpts);

    let v = c.height + s.padding.top + s.padding.bottom;
    if (!maxRowHeights[i]) maxRowHeights[i] = v;
    else maxRowHeights[i] = Math.max(maxRowHeights[i], v);

    v = c.width + s.padding.left + s.padding.right;
    if (!maxColWidths[j]) maxColWidths[j] = v;
    else maxColWidths[j] = Math.max(maxColWidths[j], v);

    return c;
  };

  let row, content = [];
  for (let i = 0; i < data.length; i++) {
    row = [];
    for (let j = 0; j < data[i].length; j++) {
      if (opts.width && j === autoWrapOnCol) {
        row.push(''); // 传个假数据去占位，之后再修改回来
      } else {
        row.push(max(i, j));
      }
    }
    content.push(row);
  }

  if (opts.width && autoWrapOnCol >= 0 && autoWrapOnCol < columns) {
    let width = opts.width - 1 - (opts.border ? columns + 1 : 0);
    maxColWidths.forEach(w => { width -= w || 0; });
    if (width < 1) width = null;  // 如果剩下的宽度太小，则不截断！
    for (let i = 0; i < data.length; i++) {
      content[i][autoWrapOnCol] = max(i, autoWrapOnCol, width);
    }
  }

  return content;
}


function _formatCell(c, s, maxWidth, maxHeight) {
  let {align, vertical} = s;
  let rows = [];
  let {top, left, right, bottom} = s.padding;
  let w = maxWidth - left - right,
    h = maxHeight - top - bottom,
    d;
  d = h - c.height;
  if (vertical === 'bottom') {
    top += d;
  } else if (vertical === 'middle') {
    top += Math.floor(d / 2);
    bottom += Math.ceil(d / 2);
  } else {
    bottom += d;
  }
  if (top) rows.push(...(new Array(top).fill(' '.repeat(maxWidth))));

  c.rows.forEach(row => {
    d = w - row.size;
    let l = left, r = right;
    if (align === 'right') {
      l += d;
    } else if (align === 'center') {
      l += Math.floor(d / 2);
      r += Math.ceil(d / 2);
    } else {
      r += d;
    }
    rows.push(' '.repeat(l) + row.startColor + row.str + ' '.repeat(r));
  });


  if (bottom) rows.push(...(new Array(bottom).fill(' '.repeat(maxWidth))));

  return rows.map(r => wrap.REST_SRG + _applyColor(s.color, r) + wrap.REST_SRG);
}

/**
 *
 * @param {Array<Array|Object>} data - Double array object
 * @param {Object} [opts = {}] - table config
 *
 *   - head       {Array}
 *   - lead       {Array}
 *   - leadHead   {String}
 *   - showHead   {Boolean} 是否显示表头，默认不显示，如果 opts 中指定了 head = []，则此值默认值自动更新为 true
 *   - showLead   {Boolean}  是否显示表左侧的索引，和表头类似
 *   - showHeadOnBottom {Boolean}   是否将表头显示在最下面
 *   - showLeadOnRight  {Boolean}   是否将表索引显示在最右边
 *   - border         {String|Object}   预先定义好的 chars 组合 或自定义，参考 {@link https://github.com/Automattic/cli-table cli-table}
 *   - borderColor    {String}         'gray'
 *   - rowFilter      {Array|Function}
 *   - colFilter      {Array|Function}
 *   - rowSort        {Array|Function}
 *   - colSort        {Array|Function}
 *
 *   - left:          {Number|String}    整数或者百分比（相对当前屏幕），如: 2, '20%'
 *   - right:         {Number}
 *   - width:         {Number}
 *   - autoWrapOnCol: {String}           如果限定了 width 或 right，则必须有一列是可以自动申缩的，用此参数指定，没指定默认取最后一列
 *   - console        {String|Boolean}   是否输出生成的内容，如果输出并可以指定要使用的 console 中的方法
 *
 *
 * @param {Object} [style = {}] - table style
 *
 *   - color: 'red.bold.bgGreen'
 *   - padding: '0 1' or [0, 1]
 *   - paddingLeft ...
 *   - ellipsis: ' ...'
 *   - align: left, center, right, default is left
 *   - vertical: top, middle, bottom , default is top
 *
 *   - width/height
 *
 *   **样式组**
 *
 *     cell/row/col
 *     dataCell/dataRow/dataCol
 *     oddRow/evenRow/oddCol/evenCol
 *     rowA/rowB.../colA/colB...
 *     rowLastA/rowLastB.../colLastA/colLastB...
 *     row1/row2/...colUser/colAge/colDesc...
 *     head/lead
 *     cellAB/cellLastAB/cellALastB/cellLastALastB/...
 *
 */
function table(data, opts = {}, style = {}) {
  _checkBorder(opts);
  helper.checkLRW(opts);
  data = _makeTableData(data, opts);
  style = _caculateTableStyle(data, opts, style);

  // 每行中最大的高度, 每列中最大的宽度
  let maxRowHeights = [], maxColWidths = [];
  let content = _caculateTableContent(data, style, maxRowHeights, maxColWidths, opts);

  let maxHeight, maxWidth, c, s;
  let rows = []; // 组装成可以直接输出的行
  let rowCount = 0;
  let {border, chars, gap = 2} = opts;


  let isLeft, isRight, borderRow;
  for (let i = 0; i < data.length; i++) {
    if (i === 0 && border) {
      borderRow = _borderRow('top', chars, maxColWidths);
      if (borderRow) rows[rowCount++] = borderRow;
    }
    for (let j = 0; j < data[i].length; j++) {
      isLeft = j === 0;
      isRight = j === data[i].length - 1;

      maxHeight = maxRowHeights[i];
      maxWidth = maxColWidths[j];
      s = style[i][j];
      c = _formatCell(content[i][j], s, maxWidth, maxHeight);
      c.forEach((str, k) => {
        if (border) {
          str = (isLeft ? chars.left : '') + str + (isRight ? chars.right : chars.vMid);
        }
        if (!rows[rowCount]) rows[rowCount] = str;
        else rows[rowCount] += str;
        rowCount += 1;
      });
      rowCount -= c.length;
    }
    if (c) rowCount += c.length;
    if (border) {
      borderRow = _borderRow(i === data.length - 1 ? 'bottom' : 'mid', chars, maxColWidths);
      if (borderRow) rows[rowCount++] = borderRow;
    }
  }

  if (opts.left > 0) rows = rows.map(r => ' '.repeat(opts.left) + r);

  rows = rows.join(os.EOL);
  if (opts.console) console[ (opts.console in console) ? opts.console : 'log'](rows);

  return rows;
}

function _borderRow(v, chars, maxColWidths) {
  let map = {
    top: ['topLeft', 'top', 'topMid', 'topRight'],
    mid: ['leftMid', 'hMid', 'hvMid', 'rightMid'],
    bottom: ['bottomLeft', 'bottom', 'bottomMid', 'bottomRight']
  };

  let k = map[v];
  return chars[k[0]] + maxColWidths.map(i => chars[k[1]].repeat(i)).join(chars[k[2]]) + chars[k[3]];
}

export default table;
