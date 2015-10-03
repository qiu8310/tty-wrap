let wrap = require('../src/cell');
let r;


let B1 = '\x1B[44m', B2 = '\x1B[41m', R = '\x1B[m', F1 = '\x1B[31m';

console.log('\n--------------- TAB 出现在换行处 -----------------');
r = wrap.cell(`${B1}\uD83D\uDCA9 23${F1}4567${R}89\t中789`, {left: 10, width: 10});
console.log(r.text, '\n', r.height, r.width);

console.log('\n--------------- TAB 出现在行尾前一点 ------------------');
r = wrap.cell(`${B1}♡ 2\x1B[31m34567\t56789`, {left: 10, width: 10});
console.log(r.text, '\n', r.height, r.width);

console.log('\n--------------- 当前行有足够的空间容纳 TAB ------------------');
r = wrap.cell(`${B1}0\t56789`, {left: 10, width: 10});
console.log(r.text, '\n', r.height, r.width);

console.log('\n--------------- V-TAB 出现在换行处 -----------------');
r = wrap.cell(`${B1}0123456789${B2}\v${B1}56789`, {left: 10, width: 10});
console.log(r.text, '\n', r.height, r.width);

console.log('\n--------------- V-TAB 出现在行尾前一点 ------------------');
r = wrap.cell(`${B1}01234567${B2}\v${B1}56789`, {left: 10, width: 10});
console.log(r.text, '\n', r.height, r.width);

