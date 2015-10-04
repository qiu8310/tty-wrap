'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _ttyText = require('tty-text');

var _ttyText2 = _interopRequireDefault(_ttyText);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

// \v[0x0B] \f[0x0C] 就不处理了，它们也会影响布局
var detectables = {
  tabsize: '\t',
  ambsize: '♡'
};

var cacheFile = _path2['default'].join(__dirname, '../data/cache.json');

var cache = JSON.parse(_fs2['default'].readFileSync(cacheFile).toString());
var clientName = process.env.TERM_PROGRAM || 'unknown';
var client = cache[clientName] || {};
var detected = { tabsize: client.tabsize || 8, ambsize: client.ambsize || 1 };

/**
 * Detect tab size and ambiguous character size, and cache them in local file.
 *
 * WARN: After executed, do not output anything before the `cb` is called.
 * @param {Number} [expired] - expired after last detected.
 * @param {Function} [cb] - callback function, get `{tabsize, ambsize}` as second paramater.
 */
function detectSize(expired, cb) {
  var keys = Object.keys(detectables);
  if (typeof expired === 'function') {
    ;

    var _ref = [expired, cb];
    cb = _ref[0];
    expired = _ref[1];
  }expired = expired || 1000 * 3600 * 24 * 30; // 默认，一个月一次就行
  cb = typeof cb === 'function' ? cb : function () {};

  if (client.timestamp && Date.now() - client.timestamp < expired) {
    cb(new Error('NOT_EXPIRED'));
  } else {
    _ttyText2['default'].detectEach(keys.map(function (k) {
      return detectables[k];
    }).join(''), function (err, chars) {
      if (err) return cb(err);
      keys.forEach(function (k, i) {
        detected[k] = chars[i].size;
      });
      cache[clientName] = detected;
      cache[clientName].timestamp = Date.now();
      _fs2['default'].writeFileSync(cacheFile, JSON.stringify(cache));
      cb(null, detected);
    });
  }
}

exports['default'] = { detectSize: detectSize, detected: detected };
module.exports = exports['default'];