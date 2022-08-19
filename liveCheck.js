// setInterval(()=>{
//     console.log(new Date().toLocaleTimeString());
// }, 1000)

var ccxws = require('ccxws')
const ccxt = require('ccxt')

var { BinanceClient } = ccxws
const binance = new BinanceClient()

const log = require('./log')
const { ohlcvs_gen, percDiff, twirlTimer, feeCalc,  getTime, getProfit, setCoinsOnTrade, removeCoinsOnTrade, timeDiff, tradeLog} = require('./fun_')
const config = require('./config')
const coinsOnTrade = require('./coinsOnTrade.json')

const coinsForTrade = require('./markets.json')


var coinsForTrade_ =  [
  'BCC',     'NANO',  'DOGE',
  'MCO',     'BEAR',  'XRPBULL',
  'EOSBEAR', 'EOSUP', 'LTCDOWN',
  'SXPDOWN', 'FIL',   'UNFI',
  'JUV',     'FIRO',  'RAMP',
  'SLP',     'KEEP',  'SANTOS',
  'API3',    'LDO',   'OP'
] 



var isEntered  = false

async function run() {
  log("RUN --", )
  chances = []

  coinsForTrade.forEach(async (coin, index) => {
    totalPricePercDiffBuy = 0
    totalPricePercDiffSell = 0
    ohlcv = await ohlcvs_gen(coin, undefined, 15, '15m')
    // log(ohlcv);


    ohlcv.forEach((candle, idx) => {
      if (idx == 0) return
      kc = candle[4]
      kcp = ohlcv[idx - 1][4]

      isBull = kc >= kcp
      pricePercDiff = percDiff(kc, kcp)

      if (isBull) {
        totalPricePercDiffSell += parseFloat(pricePercDiff)
        totalPricePercDiffBuy = 0
      } else {
        totalPricePercDiffBuy += parseFloat(pricePercDiff)
        totalPricePercDiffSell = 0
      }

      // if (!isBull) {
      // } else {
      // }

      0 &&
        log(
          kc < kcp ? '~rd' : '~grn',
          kc,
          '~reset',
          !isBull ? '~b_rd' : '~b_grn',
          !isBull ? totalPricePercDiffBuy.toFixed(1) + '%' :
          totalPricePercDiffSell.toFixed(1) + '%',
        )

      isFoundCoins = idx == ohlcv.length - 1 && Math.abs(totalPricePercDiffBuy) > config.priceDiffOnBuy
      isFoundCoins && log(coin ,'('+kc+')', '----BUY-----', '~b_rd', totalPricePercDiffBuy)
      isFoundCoins && chances.push({ coin, kc, diff: totalPricePercDiffBuy })
      // idx == ohlcv.length-1 && log( coin, "-----SELL----", totalPricePercDiffSell > config.priceDiffOnBuy ? '~b_rd' : '~b_bl', totalPricePercDiffSell > config.priceDiffOnBuy ?  totalPricePercDiffSell :  'no chances' )
    })

    // console.log( index == coinsForTrade.length-1);
    if (index == coinsForTrade.length - 1) {
      // log('coins ------------', chances)
      // log("------------", chances.reduce((a, b)=> a.diff > b.diff));
      // buy_and_watch(0, [  { coin: 'NANO', kc: 2.224, diff: 1.5862512171729264 },
      // { coin: 'NANO', kc: 0.0524, diff: 2.1215043394407016 }])

      buy_and_watch(0, chances.sort((a, b)=> a.diff < b.diff))
    }

  })

  // setTimeout(run, 15000)
  
}


async function buy_and_watch(coinIndex, chances_) {

  // log(chances_.length-1 > coinIndex, chances_.length-1 , coinIndex, "==============", chances_[coinIndex]['coin'])
  if(chances_.length-1 > coinIndex && !coinsOnTrade.includes(chances_[coinIndex]['coin'])){
  const ex = new ccxt.binance()
  await ex.loadMarkets()
  result = await ex.market(chances_[coinIndex]['coin'] + 'USDT')

  if (result.info.status != 'TRADING') {
    console.log('Exchange rejected')
    buy_and_watch(coinIndex+1, chances_)
  } else {
    isEntered  = true
    buy_price = 0
    price_pcnt_diff = 0
    start_time = 0
    
    const market = {
      id: result.id,
      base: result.base,
      quote: result.quote,
      // type: "spot", // string - the type of market: spot, futures, option, swap
    }

    // GET OHLCVS
    // Place Buy Order
    // Watch
    // Sell


    binance.on('error', (err) => console.error(err))
    binance.on('ticker', (ticker, market) => {
      if(!buy_price){
        buy_price = ticker['last']
        start_time = ticker['timestamp']
        setCoinsOnTrade(ticker['base'])
      }
      price_pcnt_diff = percDiff(parseFloat(ticker['last']), parseFloat(buy_price))
      date = getTime(ticker['timestamp'])
      priceDiff = getProfit(parseFloat(buy_price), parseFloat(ticker['last']))
      inrDiff = getProfit(parseFloat(buy_price), parseFloat(ticker['last']))*config.inr
      log(price_pcnt_diff<0? '~rd': price_pcnt_diff>1?'~grn':'',ticker['base'] , date[1] , "("+timeDiff(getTime(start_time)[2], date[2])+")", "$buy", buy_price, "$live:", ticker['last'], '~mgnta', price_pcnt_diff.toFixed(1)+'%', '~yl', priceDiff.toFixed(3) , 'Rs',inrDiff.toFixed(0))
    
      // on profit
    if(price_pcnt_diff>config.priceDiffOnSell){
      log("~b_grn", priceDiff, "COMPLETED WON :)")
      binance.unsubscribeTicker(market)
      removeCoinsOnTrade(ticker['base'])
      log('restart bot')
      writeTradeLog()
      isEntered = false
      setTimeout(run, 5000)
    }

    // on loss
    // console.log(parseInt(start_time[1].split(":")[0])); after n hour execute
    if(config.stopLimit > priceDiff){
      log("~b_rd", priceDiff, "COMPLETED LOST :)")
      binance.unsubscribeTicker(market)
      removeCoinsOnTrade(ticker['base'])
      log('restart bot')
      writeTradeLog("LOSS")
      isEntered = false
      setTimeout(run, 15000)
    }

    // WRITE TRADING LOGS 
    function writeTradeLog(status = "WIN") {
      start_time_ = getTime(start_time)
      end_time = getTime(ticker['timestamp'])
      logs = {
        coin:ticker['base'],
        status,
        buy_price,
        sell_price: ticker['last'],
        quote:ticker['quote'],
        profit: priceDiff,  
        inr_profit: "Rs "+inrDiff.toFixed(3),  
        profit: priceDiff.toFixed(3)+ " ("+price_pcnt_diff.toFixed(2)+"%)",
        start_time: start_time_[1],
        exit_time: end_time[1],
        holding_time: timeDiff(start_time_[2], end_time[2]),
      }
      log_file= end_time[0].split('/').join('_')+'.json'
      tradeLog(log_file, logs)
    }

    })

    binance.subscribeTicker(market)
  }
}else{
  log("sleeeeeeeeeeeeeeeeeeping... 30s")
  !isEntered && setTimeout(run, 30000)
} 

}

run()


// log(getProfit(6.48600000,6.51400000)*75)


// Ticker {
//   exchange: 'Binance',
//   base: 'DUSK',
//   quote: 'USDT',
//   timestamp: 1660462180736,
//   sequenceId: undefined,
//   last: '0.17650000',
//   open: '0.18220000',
//   high: '0.18060000',
//   low: '0.16710000',
//   volume: '19613190.00000000',
//   quoteVolume: '3375424.32470000',
//   change: '0.00570000',
//   changePercent: '3.337',
//   bid: '0.17640000',
//   bidVolume: '5892.00000000',
//   ask: '0.17650000',
//   askVolume: '4645.00000000'
// } { id: 'DUSKUSDT', base: 'DUSK', quote: 'USDT' }