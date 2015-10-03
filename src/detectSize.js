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
 * @param {Function} cb - callback function, get `{tabsize, ambsize}` as second paramater.
 */
function detectSize(cb) {
  let keys = Object.keys(detectables);
  cb = typeof cb === 'function' ? cb : () => {};

  ttyText.detectEach(keys.map(k => detectables[k]).join(''), (err, chars) => {
    if (err) return cb(err);
    keys.forEach((k, i) => {
      detected[k] = chars[i].size;
    });
    cache[clientName] = detected;
    cache.timestamp = Date.now();
    fs.writeFileSync(cacheFile, JSON.stringify(cache));
    cb(null, detected);
  });
}

export default { detectSize, detected };
