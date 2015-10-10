'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _wrap = require('./wrap');

var _wrap2 = _interopRequireDefault(_wrap);

var _table = require('./table');

var _table2 = _interopRequireDefault(_table);

var _cell = require('./cell');

var _cell2 = _interopRequireDefault(_cell);

var _ttyText = require('tty-text');

var _ttyText2 = _interopRequireDefault(_ttyText);

var _ttySize = require('tty-size');

var _ttySize2 = _interopRequireDefault(_ttySize);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

require('es6-shim');

_wrap2['default'].tt = _ttyText2['default'];
_wrap2['default'].ts = _ttySize2['default'];
_wrap2['default'].chalk = _chalk2['default'];

_wrap2['default'].table = _table2['default'];
_wrap2['default'].cell = _cell2['default'];

exports['default'] = _wrap2['default'];
module.exports = exports['default'];