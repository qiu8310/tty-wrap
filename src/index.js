import wrap from './wrap';
import table from './table';
import cell from './cell';

import ttyTextSize from 'tty-text-size';
import ttySize from 'tty-size';
import chalk from 'chalk';

wrap.ttyTextSize = ttyTextSize;
wrap.ttySize = ttySize;
wrap.chalk = chalk;

wrap.table = table;
wrap.cell = cell;

export default wrap;
