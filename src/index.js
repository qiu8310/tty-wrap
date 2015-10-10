require('es6-shim');

import wrap from './wrap';
import table from './table';
import cell from './cell';

import tt from 'tty-text';
import ts from 'tty-size';
import chalk from 'chalk';

wrap.tt = tt;
wrap.ts = ts;
wrap.chalk = chalk;

wrap.table = table;
wrap.cell = cell;

export default wrap;
