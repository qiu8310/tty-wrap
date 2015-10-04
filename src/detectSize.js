import ttyText from 'tty-text';
import path from 'path';
import fs from 'fs';


// \v[0x0B] \f[0x0C] 就不处理了，它们也会影响布局
let detectables = {
  tabsize: '\t',
  ambsize: '\u2661'
};

const cacheFile = path.join(__dirname, '../data/cache.json');

let cache = JSON.parse(fs.readFileSync(cacheFile).toString());
let clientName = process.env.TERM_PROGRAM || 'unknown';
let client = cache[clientName] || {};
let detected = {tabsize: client.tabsize || 8, ambsize: client.ambsize || 1};


/**
 * Detect tab size and ambiguous character size, and cache them in local file.
 *
 * WARN: After executed, do not output anything before the `cb` is called.
 * @param {Number} [expired] - expired after last detected.
 * @param {Function} [cb] - callback function, get `{tabsize, ambsize}` as second paramater.
 */
function detectSize(expired, cb) {
  let keys = Object.keys(detectables);
  if (typeof expired === 'function') [cb, expired] = [expired, cb];

  expired = expired || 1000 * 3600 * 24 * 30; // 默认，一个月一次就行
  cb = typeof cb === 'function' ? cb : () => {};

  if (client.timestamp && Date.now() - client.timestamp < expired) {
    cb(new Error('NOT_EXPIRED'));
  } else {
    ttyText.detectEach(keys.map(k => detectables[k]).join(''), (err, chars) => {
      if (err) return cb(err);
      keys.forEach((k, i) => {
        detected[k] = chars[i].size;
      });
      cache[clientName] = detected;
      cache[clientName].timestamp = Date.now();
      fs.writeFileSync(cacheFile, JSON.stringify(cache));
      cb(null, detected);
    });
  }
}

export default { detectSize, detected };
