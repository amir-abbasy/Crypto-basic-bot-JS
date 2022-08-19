const { getBySelSupport, getTime, timeDiff, getProfit } = require('./fun_')
const log = require('./log')

const ccxt = require('ccxt')
const fs = require('fs')

// const ex = new ccxt.binance({
//   api_key : 'Zm736zqFfeUpi2n2wRCIt0TIzIpl9rUm3gYZDndj382iSz4V9tbh5LBU1udtDdMo',
//   api_secret : '7xD8hcp2NleymDO5EQ2UCIbg3D07xBN50xfgxi9du0JYeVBEHZA1fE7kw6xkNlRC',
//   verbose: true 
// })

var ex = new ccxt.phemex({
  //   enableRateLimit: true,
  apiKey: 'ba9237f1-1902-4297-a1ea-f1d26ac8ac0f',
  secret:
    'fPUOp4fONIhYvy5PNT30kJ9ZSMYNp8q6vspcCHYbwX1iMWIzZDA0NS1hMzRhLTQyNjUtYjE4MC1mYzBmYjI0ZWVjY2I',
})
ex.setSandboxMode(true)


async function ohlcvs_gen(symbol = 'TRX', since = undefined ) {
  const pair = 'USDT'
  const period = '5m'
  const back = 288
  
  // var date = new Date()
  // const start_date = since ? Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate()-since, 22, 00, 00, 00) / 1000 ): undefined

  const now = ex.milliseconds()
  const oneDay = 60 * 60 * 24 * since * 1000 // milliseconds
  // const oneWeek = 60 * 60 * 24 * 7 * 1000 // milliseconds
  const start_date = since ? now - oneDay : undefined

  // 01m - 1440
  // 03m - 480
  // 05m - 288
  // 15m - 96
// console.log("->", date.getFullYear(), date.getMonth(), date.getDate()-since, 22, 00, 00, 00);
    ohlcvs_json = await ex.fetchOHLCV(symbol + pair, period, start_date, back)
  return ohlcvs_json
}

// 1 /  2.189061 
// 3 /  996391

// ohlcvs_gen(undefined, 2).then(data => log(data[0]));


const ohlcvs = [
  [1657652400000, 0.0403, 0.0404, 0.0401, 0.0402, 41396.4],
  [1657653300000, 0.0403, 0.0403, 0.0401, 0.0401, 124476.3],
  [1657654200000, 0.0401, 0.0403, 0.0401, 0.0411, 70640.4],
  [1657655100000, 0.0401, 0.0406, 0.0401, 0.0403, 116042.5],
  [1657656000000, 0.0403, 0.0404, 0.0401, 0.0404, 48936.5],
  [1657656900000, 0.0404, 0.0404, 0.0403, 0.0413, 28672.1],
  [1657657800000, 0.0405, 0.0408, 0.0405, 0.0406, 49776.2],
  [1657658700000, 0.0405, 0.0405, 0.0402, 0.0405, 68214.8],
]
var prevSupports = []
var backSupport = 0
for (const key in ohlcvs) {
  const k = ohlcvs[key]
  var buyersSupport = getBySelSupport(k[1], k[2], k[3], k[4])

  //   prevSupports.push(buyersSupport ? 1 : 0)
  //   backSupport += 1

  //   if (backSupport == 3) {
  //     backSupport = 0
  //     log(prevSupports)
  //     prevSupports = []
  //   }

  //   prevSupports.push(buyersSupport ? 1 : 0)
  //   backSupport += 1
  if (key > 1) {
    var array = [1, 2, 3]
    for (let index = 0; index < array.length; index++) {
      // const element = array[index]
      prevSupports[index] = getBySelSupport(
        ohlcvs[key - index][1],
        ohlcvs[key - index][2],
        ohlcvs[key - index][3],
        ohlcvs[key - index][4],
      )
        ? 1
        : 0
    }
  }
  // console.log(prevSupports.length > 2 && prevSupports.reduce((a,b)=> a+b))
  //   prevSupports[0]=getBySelSupport(k[1], k[2], k[3], k[4])
}

// var i = 1;

// function myLoop() {
//   setTimeout(function() {
//     console.log('hello');
//     i++;
//     if (i < 10) {
//       myLoop();
//     }
//   }, 800)
// }

// myLoop();





// {
//   buy_price: 0.01808,
//   sell_price: 0.01792,
//   profit: '-0.00016',
//   inrProfit: -10.46053097345135,
//   date_time: '8/12/2022 7:15:00 AM',
//   hold_time: '0 hours, 5 minutes :)'
// }


function coinConvert_(buy_price = 100, sell_price = 101, invest = 12) {
  var inr = 79.67
  var takerMakerFee = 2
  var diff = sell_price - buy_price
  return (diff * invest) * inr - takerMakerFee
}


// {
//   buy_price: 0.3802,
//   sell_price: 0.3798,
//   profit: -0.26262493424513345,
//   inrProfit: -20.923328511309784,
//   date_time: '8/11/2022 8:35:00 PM',
//   hold_time: '0 hours, 20 minutes :)'
// }


function coinConvert(buy_price = 0.3802, sell_price = 0.3798, invest = 12) {
  var takerMakerFee = 0.024
  var amount = invest/buy_price
  return (amount*sell_price - amount*buy_price)-takerMakerFee
}


async function test(){
  account_balance = await ex.fetch_balance()
  log(account_balance)

  const symbol = 'ADA/USDT'
  const amount = 5 // BTC
  const price = 0 // USD
  // cost = amount * price = 2 * 9000 = 18000 (USD)
  
  // createOrder('WAVES/USDN', 'limit', 'buy', 0.5, 1.05)
  
  // BUY 
  // const order = await ex.createOrder (symbol, 'market', 'buy', amount, undefined)
  
  // SELL 
  // const order = await ex.createOrder (symbol, 'market', 'sell', amount,  undefined, {positionSide: "LONG"})
  // console.log (order)
}



function live() {
  
}


live()

// $0.2 (-1.65%)

function feeCalc(price, invest, fee=0.10) {
  total_coins = invest/price
  // console.log("total_coins",total_coins);
  totalFee = percentage(total_coins * price, fee)
  // console.log("totalFee",totalFee);
 return totalFee
}

// 22.19259100 ADA
// fee = feeCalc(0.2, 12)
// console.log(fee, "--- Rs",((fee)*79.40).toFixed(3))

function percentage(num, per)
{
 return (num/100)*per;
}



function tradeLog(log_file, logs){
  var tradeLogs_json = []
  try {
    if (fs.existsSync('./logs/'+log_file)) {
       tradeLogs_json = require('./logs/'+log_file)
    }
  } catch(err) {
    console.error(err)
  }
  tradeLogs = tradeLogs_json
  tradeLogs.push(logs)
  fs.writeFile('logs/'+log_file, JSON.stringify(tradeLogs), 'utf8', (err) => {
    if (err) throw err
    // console.log('logs write to json file')
  })
}


date = getTime(1660682100000)

// console.log(getTime(1660682100000)[2]);
// console.log(getTime(1660748700000));

var sellTime_ = getTime(1660748700000)
// console.log(parseInt(date[1].split(":")[0]));

logs = {
  coin:"EOS",
  buy_price: 1.53500000,
  sell_price: 1.55000000,
  profit: 0.0232345,  
  inr_profit: 11,  
  profit: "1.0%" ,
  start_time: date[1],
  exit_time: sellTime_[1],
  holding_time: timeDiff(date[2], sellTime_[2]),
}

log_file= date[0].split('/').join('_')+'.json'
// console.log(log_file);
// tradeLog(log_file, logs)

console.log(-0.18 > -0.180);
// console.log(getProfit(8.21000000,8.10800000));
// console.log(getProfit(100,105, 100));
// console.log(getProfit(167.30000000,167.10000000));
// console.log(getProfit(167.30000000,167.10000000)*79.67);