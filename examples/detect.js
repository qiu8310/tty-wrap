var wrap = require('../build/index');

wrap.table({
  a: ['a', 'b\t', 'c', 'd'],
  n: [1, 2, 3, 4]
}, {console: 'log'});



wrap.detectSize();
