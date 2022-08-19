colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  bk: "\x1b[30m",
  rd: "\x1b[31m",
  grn: "\33[32m",
  yl: "\x1b[33m",
  bl: "\x1b[34m",
  mgnta: "\x1b[35m",
  cyn: "\x1b[36m",
  wt: "\x1b[37m",

  b_bk: "\x1b[40m",
  b_rd: "\x1b[41m",
  b_grn: "\x1b[42m",
  b_yl: "\x1b[43m",
  b_bl: "\x1b[44m",
  b_mgnta: "\x1b[45m",
  b_cyn: "\x1b[46m",
  b_wt: "\x1b[47m",
};

// Example log("~b_blue", "msg1", "~reset", "~yellows", "msg2");
// @amir_abbasy_

function getColor(clr) {
  var color = Object.entries(colors).filter((c) => c[0] == clr)[0];
  return color ? color[1] : colors.white;
}

module.exports = (...args) => {
  var print = Object.values(args).map((__) => {
    if(typeof(__) == 'number')return __+''
    if (__.toString().includes("~")) {
      return getColor(__.slice(1));
    } else {
      return __;
    }
  });

  // LOG
  console.log(...print, getColor("reset"));
};
