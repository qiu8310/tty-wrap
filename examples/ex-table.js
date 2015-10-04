import table from '../src/table';
import chalk from 'chalk';


table(
  [
    {age: 4, user: '\u2661 \u2661 \u2661 \u2661', desc: 'abcd'},
    {age: 20, user: chalk.bgGreen('中华人民共合国'), desc: '这里是很长的内容这里是很长的内容这里是很长的内容这里是很长的的内容这里是很长的内容内容这里是很长的的内容这里是很长的内容内容这里是很长的的内容这里是很长的内容'}
  ],

  {
    left: 10,
    showHead: true,
    showLead: true,
    leadHead: 'Perple',
    lead: ['1', '2'],
    showLeadOnRight: false,
    border: 'simple',
    colSort: ['user', 'age', 'desc'],
  },

  {
    colB: {
      paddingRight: 5,
    },
    rowA: {
      color: 'bgBlue'
    },
    colA: {
      color: 'bgMagenta',
      align: 'center',
      vertical: 'middle'
    },
    cellAA: {
      color: 'red.bold.bgCyan'
    },
    cellLastALastA: {
      width: 50,
      color: 'bgWhite.black'
    }
  }
)
