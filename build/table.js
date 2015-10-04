'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var _wrap = require('./wrap');

var _wrap2 = _interopRequireDefault(_wrap);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _ttySize = require('tty-size');

var _ttySize2 = _interopRequireDefault(_ttySize);

require('es6-shim');

var defaultStyles = {
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
var simple = {
  topLeft: '⌌', top: '-', topMid: '-', topRight: '⌍',
  left: '|', leftMid: '|', hMid: '-', vMid: '|', hvMid: '+', right: '|', rightMid: '|',
  bottomLeft: '⌎', bottom: '-', bottomMid: '-', bottomRight: '⌏'
};
var single = {
  topLeft: '┌', top: '─', topMid: '┬', topRight: '┐',
  left: '╎', leftMid: '├', hMid: '─', vMid: '╎', hvMid: '┼', right: '╎', rightMid: '┤',
  bottomLeft: '└', bottom: '─', bottomMid: '┴', bottomRight: '┘'
};
var double = {
  topLeft: '╔', top: '═', topMid: '╦', topRight: '╗',
  left: '║', leftMid: '╠', hMid: '═', vMid: '║', hvMid: '╬', right: '║', rightMid: '╣',
  bottomLeft: '╚', bottom: '═', bottomMid: '╩', bottomRight: '╝'
};

var defaultChars = { simple: simple, single: single, double: double };

// 解析 padding ，使它可以像设置 css 一样设置 四个方向上的值
function _d4(padding, s) {
  if (!Array.isArray(padding)) padding = padding.toString().trim().split(/\s+/);
  padding = padding.map(Number);
  var len = padding.length;
  var top = padding[0];
  var right = len === 1 ? top : padding[1];
  var bottom = len <= 2 ? top : padding[2];
  var left = len <= 3 ? right : padding[3];
  if (s.paddingTop) top = Number(s.paddingTop);
  if (s.paddingLeft) left = Number(s.paddingLeft);
  if (s.paddingRight) right = Number(s.paddingRight);
  if (s.paddingBottom) bottom = Number(s.paddingBottom);
  return { top: top, right: right, bottom: bottom, left: left };
}

function _checkBorder(opts) {
  var chars = defaultChars.simple;
  opts.borderColor = opts.borderColor || 'gray';

  var border = opts.border;
  if (border) {
    if (typeof border === 'string' && defaultChars[border]) {
      chars = defaultChars[border];
    } else if (typeof border === 'object') {
      Object.keys(border).forEach(function (k) {
        chars[k] = border[k];
      });
    }

    Object.keys(chars).forEach(function (k) {
      chars[k] = chars[k] ? _applyColor(opts.borderColor, chars[k]) : '';
    });
    opts.chars = chars;
  }
}

function _applyFilter(filter, rows) {
  if (Array.isArray(filter)) {
    // 确保它是字符串
    filter = filter.map(function (f) {
      return f.toString();
    });
    rows = rows.filter(function (row) {
      return filter.includes(row.label);
    });
  } else if (typeof filter === 'function') {
    rows = rows.filter(filter);
  }
  return rows;
}

function _applySort(sort, rows) {
  if (Array.isArray(sort)) {
    return sort.map(function (n) {
      return rows.find(function (r) {
        return r.label === n.toString();
      });
    }).filter(function (n) {
      return n;
    });
  } else if (typeof sort === 'function') rows.sort(sort);
  return rows;
}

// 生成表格用的 data
function _makeTableData(data, opts) {
  var head = opts.head;
  var lead = opts.lead;
  var rowFilter = opts.rowFilter;
  var colFilter = opts.colFilter;
  var rowSort = opts.rowSort;
  var colSort = opts.colSort;
  var _opts$leadHead = opts.leadHead;
  var leadHead = _opts$leadHead === undefined ? '' : _opts$leadHead;

  var leadKeys = Object.keys(data);

  if (lead && lead.length) {
    if (!('showLead' in opts)) opts.showLead = true;
  } else {
    lead = leadKeys;
  }

  var rows = leadKeys.map(function (k, i) {
    return { label: lead[i], data: data[k] };
  });
  if (rowFilter) rows = _applyFilter(rowFilter, rows);
  if (rowSort) rows = _applySort(rowSort, rows);
  lead = rows.map(function (r) {
    return r.label;
  });

  var headKeys = leadKeys.length ? Object.keys(data[leadKeys[0]]) : [];
  if (head && head.length) {
    if (!('showHead' in opts)) opts.showHead = true;
  } else {
    head = headKeys;
  }

  var cols = headKeys.map(function (k, i) {
    return { label: head[i], data: rows.map(function (row) {
        return row.data[k];
      }) };
  });

  if (colFilter) cols = _applyFilter(colFilter, cols);
  if (colSort) cols = _applySort(colSort, cols);
  head = cols.map(function (c) {
    return c.label;
  });

  data = [];

  cols.forEach(function (col, i) {
    col.data.forEach(function (val, j) {
      if (!data[j]) data[j] = [];
      data[j][i] = val;
    });
  });

  if (opts.showLead) {
    (function () {
      var method = opts.showLeadOnRight ? 'push' : 'unshift';
      data.forEach(function (row, i) {
        return row[method](lead[i]);
      });
      head[method](leadHead);
    })();
  }
  if (opts.showHead) data[opts.showHeadOnBottom ? 'push' : 'unshift'](head);

  return data;
}

function _getCommonStyle(style) {
  var common = {};
  Object.keys(defaultStyles).forEach(function (k) {
    common[k] = style[k] || defaultStyles[k];
  });
  return common;
}

function _caculateCellStyle(i, j, val, rowCount, colCount, opts, common, style) {
  var isOddRow = i % 2,
      isOddCol = j % 2;
  var isLastRow = i === rowCount - 1,
      isLastCol = j === colCount - 1;
  var isHead = opts.showHead ? opts.showHeadOnBottom ? isLastRow : i === 0 : false;
  var isLead = opts.showLead ? opts.showLeadOnRight ? isLastCol : j === 0 : false;
  var rowAlpha = String.fromCharCode(i + 65),
      colAlpha = String.fromCharCode(j + 65);
  var rowLastAlpah = 'Last' + String.fromCharCode(64 + rowCount - i),
      colLastAplha = 'Last' + String.fromCharCode(64 + colCount - j);

  var styles = [isOddRow ? 'oddRow' : 'evenRow', isOddCol ? 'oddCol' : 'evenCol', 'row' + rowAlpha, 'col' + colAlpha, 'row' + rowLastAlpah, 'col' + colLastAplha, isHead && 'head', isLead && 'lead', 'cell' + rowAlpha + colAlpha, 'cell' + rowLastAlpah + colAlpha, 'cell' + rowAlpha + colLastAplha, 'cell' + rowLastAlpah + colLastAplha].filter(function (k) {
    return k && style[k];
  }).map(function (k) {
    return style[k];
  });

  return _getCommonStyle(Object.assign.apply(Object, [{}, common].concat(_toConsumableArray(styles))));
}

function _caculateTableStyle(data, opts, style) {
  var rowCount = data.length;
  var colCount = rowCount ? data[0].length : 0;
  var result = [],
      row = undefined;
  var common = _getCommonStyle(style);
  for (var i = 0; i < rowCount; i++) {
    row = [];
    for (var j = 0; j < colCount; j++) {
      row.push(_caculateCellStyle(i, j, data[i][j], rowCount, colCount, opts, common, style));
    }
    result.push(row);
  }
  return result;
}

function _applyColor(colors, val) {
  if (!colors) return val;
  var ref = _chalk2['default'];
  colors.split('.').forEach(function (c) {
    return ref = ref[c] || ref;
  });
  return ref(val);
}

// 计算表格每个单元的带样式的内容
function _caculateTableContent(data, style, maxRowHeights, maxColWidths) {
  var row = undefined,
      c = undefined,
      s = undefined,
      v = undefined,
      content = [];
  for (var i = 0; i < data.length; i++) {
    row = [];
    for (var j = 0; j < data[i].length; j++) {
      s = style[i][j];
      s.padding = _d4(s.padding, s);

      c = (0, _wrap2['default'])(data[i][j] == null ? '' : data[i][j].toString(), s);
      row.push(c);

      v = c.height + s.padding.top + s.padding.bottom;
      if (!maxRowHeights[i]) maxRowHeights[i] = v;else maxRowHeights[i] = Math.max(maxRowHeights[i], v);

      v = c.width + s.padding.left + s.padding.right;
      if (!maxColWidths[j]) maxColWidths[j] = v;else maxColWidths[j] = Math.max(maxColWidths[j], v);
    }
    content.push(row);
  }
  return content;
}

function _formatCell(c, s, maxWidth, maxHeight) {
  var align = s.align;
  var vertical = s.vertical;

  var rows = [];
  var _s$padding = s.padding;
  var top = _s$padding.top;
  var left = _s$padding.left;
  var right = _s$padding.right;
  var bottom = _s$padding.bottom;

  var w = maxWidth - left - right,
      h = maxHeight - top - bottom,
      d = undefined;
  d = h - c.height;
  if (vertical === 'bottom') {
    top += d;
  } else if (vertical === 'middle') {
    top += Math.floor(d / 2);
    bottom += Math.ceil(d / 2);
  } else {
    bottom += d;
  }
  if (top) rows.push.apply(rows, _toConsumableArray(new Array(top).fill(' '.repeat(maxWidth))));

  c.rows.forEach(function (row) {
    d = w - row.size;
    var l = left,
        r = right;
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

  if (bottom) rows.push.apply(rows, _toConsumableArray(new Array(bottom).fill(' '.repeat(maxWidth))));

  return rows.map(function (r) {
    return _wrap2['default'].REST_SRG + _applyColor(s.color, r) + _wrap2['default'].REST_SRG;
  });
}

/**
 *
 * @param {Array<Array|Object>} data - Double array object
 * @param {Object} [opts = {}] - table config
 *
 *   - head       {Array}
 *   - lead       {Array}
 *   - leadHead   {String}
 *   - showHead     {Boolean} 是否显示表头，默认不显示，如果 opts 中指定了 head = []，则此值默认值自动更新为 true
 *   - showLead     {Boolean}  是否显示表左侧的索引，和表头类似
 *   - showHeadOnBottom {Boolean}   是否将表头显示在最下面
 *   - showLeadOnRight  {Boolean}   是否将表索引显示在最右边
 *   - border     {String|Object}   预先定义好的 chars 组合 或自定义，参考 {@link https://github.com/Automattic/cli-table cli-table}
 *   - borderColor {String}         'gray'
 *   - rowFilter {Array|Function}
 *   - colFilter {Array|Function}
 *   - rowSort   {Array|Function}
 *   - colSort   {Array|Function}
 *   - left:     {Number}           0
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
 *   - row, col, odd/evenRow/Col, row/colA/B.., row/colLastA/B, head, lead, cellAA, cellAB...
 *
 */
function table(data) {
  var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
  var style = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  _checkBorder(opts);
  data = _makeTableData(data, opts);
  style = _caculateTableStyle(data, opts, style);

  // 每行中最大的高度, 每列中最大的宽度
  var maxRowHeights = [],
      maxColWidths = [];
  var content = _caculateTableContent(data, style, maxRowHeights, maxColWidths);

  var maxHeight = undefined,
      maxWidth = undefined,
      c = undefined,
      s = undefined;
  var rows = []; // 组装成可以直接输出的行
  var rowCount = 0;
  var border = opts.border;
  var chars = opts.chars;
  var _opts$gap = opts.gap;
  var gap = _opts$gap === undefined ? 2 : _opts$gap;

  var isLeft = undefined,
      isRight = undefined,
      borderRow = undefined;
  for (var i = 0; i < data.length; i++) {
    if (i === 0 && border) {
      borderRow = _borderRow('top', chars, maxColWidths);
      if (borderRow) rows[rowCount++] = borderRow;
    }
    for (var j = 0; j < data[i].length; j++) {
      isLeft = j === 0;
      isRight = j === data[i].length - 1;

      maxHeight = maxRowHeights[i];
      maxWidth = maxColWidths[j];
      s = style[i][j];
      c = _formatCell(content[i][j], s, maxWidth, maxHeight);
      c.forEach(function (str, k) {
        if (border) {
          str = (isLeft ? chars.left : '') + str + (isRight ? chars.right : chars.vMid);
        }
        if (!rows[rowCount]) rows[rowCount] = str;else rows[rowCount] += str;
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

  rows.forEach(function (r, i) {
    console.log(' '.repeat(opts.left || 0) + r);
  });
}

function _borderRow(v, chars, maxColWidths) {
  var map = {
    top: ['topLeft', 'top', 'topMid', 'topRight'],
    mid: ['leftMid', 'hMid', 'hvMid', 'rightMid'],
    bottom: ['bottomLeft', 'bottom', 'bottomMid', 'bottomRight']
  };

  var k = map[v];
  return chars[k[0]] + maxColWidths.map(function (i) {
    return chars[k[1]].repeat(i);
  }).join(chars[k[2]]) + chars[k[3]];
}

exports['default'] = table;
module.exports = exports['default'];