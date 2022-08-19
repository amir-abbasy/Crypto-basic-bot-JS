// JavaScript
const ccxt = require('ccxt')
const ex = new ccxt.binance()

const log = require('./log')
// const ohlcvs = require('./ohlcvs.json')
const markets_json = require('./markets.json')

const {
  ohlcvs_gen,
  percDiff,
  getBySelSupport,
  Line,
  // coinConvert,
  getProfit,
  getTime,
  timeDiff,
  loadMarkets
} = require('./fun_')

function main(ohlcvs, symbol) {

var config = {
  _percDiff: 2, // 100%
  _stopLoss: 2.5, // 100%
  bearingLoss : 0.13, // 10rs
  bearingLossOnCoin : 0.050, // 5rs
  backSupport: 3,
  invest: 12,
  inr : 79.67

}

var totalPricePercDiffBuy = 0
var totalPricePercDiffSell = 0
var left = true // left (buy), right (sell)
var isShowBuy = false
var isShowSell = false
var lastBuySell = [0, 0]
var buySell = [[], []]
var buyTime = null
var trend = 0
var superLow = 0
var totalLoss = 0 
var final_val =[0] 


var periodProf = [0, 0]
var skip = true

var prevSupports = []

var is_place_order = false
var orderDetails = {
  buy_price: 0,
  sell_price: 0,
}
var final = []


const bot = () => {
 
    for (const key in ohlcvs) {
    const k = ohlcvs[key]
    const kp = ohlcvs[key - 1] ? ohlcvs[key - 1] : ohlcvs[0]
    const close = k[4]
    var date = getTime(k[0])

    // buySell[0].push(close)

    if (key > 1) {
    var isBull = close > kp[4]
    var pricePercDiff = Math.abs(percDiff(close, kp[4])).toFixed(1)
    var buyersSupport = getBySelSupport(k[1], k[2], k[3], close)

    left = isBull

    //  /////////////////////// %

    if (left) {
      totalPricePercDiffBuy += parseFloat(pricePercDiff)
    } else {
      totalPricePercDiffBuy = 0
    }

    if (!left) {
      totalPricePercDiffSell += parseFloat(pricePercDiff)
    } else {
      totalPricePercDiffSell = 0
    }

    if (key > config.backSupport) {
      for (let index = 0; index < config.backSupport; index++) {
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



    if((superLow - -0.5) < trend ){
      // console.log(date[1], "catch", (superLow - -0.5) , '<',trend);
      // log(date[1], '~grn', "catch", '0.5% price increased');
      superLow = trend
      skip = false
    }


 
    // exit from trade when stoploss(%) match 
    if(is_place_order){
      price_perc_diff_after_buy = percDiff(close, orderDetails.buy_price).toFixed(1)
      // log(Math.abs((close - orderDetails.buy_price)*config.invest) > config.bearingLossOnCoin  ? '~rd': '~grn', Math.abs((close - orderDetails.buy_price)*config.invest))
      if(close < orderDetails.buy_price && Math.abs(getProfit(close , orderDetails.buy_price)) > config.bearingLossOnCoin){
        // sell()
        totalLoss += getProfit(close,orderDetails.buy_price)
        // log( config.bearingLossOnCoin, '>' , totalLoss," : stoploss exit ")
     }
    }



      // BUY
      if (!is_place_order 
        && !skip 
        && left && !isShowBuy 
        && lastBuySell[0] > config._percDiff) {
      buy()
      }
      isShowBuy = true
      if (!left) isShowBuy = false
  
      // SELL
      if (is_place_order && !left && !isShowSell && lastBuySell[1] > config._percDiff) {
       sell()
      }
      isShowSell = true
      if (left) isShowSell = false
  
    lastBuySell[0] = isBull ? totalPricePercDiffBuy : totalPricePercDiffSell
    lastBuySell[1] = isBull ? totalPricePercDiffBuy : totalPricePercDiffSell

    buySell[left ? 0 : 1].push(close)

    var new_trend = isBull ? trend+parseFloat(pricePercDiff) : trend-parseFloat(pricePercDiff)
    superLow = new_trend <= superLow ? new_trend : superLow  
    trend = new_trend

    // OUT
    0 &&
      log(
        '~cyn',
        date[1],
        close,
        isBull ? '~b_grn' : '~b_rd',
        pricePercDiff + '%',
        // "~wt",
        // "|",
        // isBull ? totalPricePercDiffBuy : totalPricePercDiffSell,
        '~reset',
        buyersSupport ? '~grn' : '~rd',
        prevSupports.length > 1 && Line(prevSupports.reduce((a, b) => a + b)),
        // lastBuySell[1].toFixed(1) + '%',
        trend > 0 ? '~grn' : '~rd',
        trend.toFixed(1)+'%',
        '~bl',
        superLow.toFixed(1)+'%',
      )

    }



    // ESCAPE
    if(Math.abs(totalLoss) > config.bearingLoss){
      // 1&&log('~b_rd',
      // symbol,'ESCAPED FROM COIN , TOTAL LOSS :(',
      // )
      break;
    }
    


   


  function buy() {
      buySell = [[], []]

      0&&log(
        '~b_bk',
        '                  ' + close,
        '~b_bl',
        lastBuySell[0].toFixed(1) + '%',
        '~b_rd',
        skip ? '__skip__' : 'enter',
      )

    if(!is_place_order)buyTime= k[0]
    is_place_order = true
    skip = true
    if (is_place_order) {
      orderDetails.buy_price = close  
    }

  }

  function sell() {
    0&&log(
      '~b_bk',
      '                  ' + close,
      '~b_bl',
      lastBuySell[1].toFixed(1) + '%',
      '~b_grn',
      skip ? '__skip__' : 'exit',
    )

    if (is_place_order) {
      var buyTime_ = getTime(buyTime)
      var sellTime_ = getTime(k[0])
      // console.log("---------------",buyTime, sellTime_[2]);
      orderDetails.sell_price = close
      orderDetails.profit = getProfit(orderDetails.buy_price, close)
        // orderDetails.inrProfit= getProfit(undefined,  orderDetails.buy_price, close).toFixed(3)
      orderDetails.inrProfit = getProfit(orderDetails.buy_price, close)*config.inr
      orderDetails.date_time = date[0] + ' ' + date[1]
      orderDetails.hold_time = timeDiff(buyTime_[2], sellTime_[2])

      // console.log(orderDetails)
      final.push(orderDetails.inrProfit)
      trend = 0
    }
    is_place_order = false
  }

}
      // if(ohlcvs.length > 0)log('~b_yl',  "start", ohlcvs[0][4]+'', "end", ohlcvs[ohlcvs.length -1][4]+'');
     
    
      if(final.length > 0 )final_val =  final.reduce((a, b) => a + b)
      if(final.length > 0){
         log('~grn',symbol, '~reset', final_val > 0 ? final_val > 30 ? '~b_bl' : '~bl' : '~rd', final_val.toFixed(3), '~reset',Math.abs(totalLoss) > config.bearingLoss ? " :(" : '')
      }
  }

    bot();
    return {final_val, symbol}

    
}


// ohlcvs_gen('DOT',bot);
// bot()
var totalLoss = []
var totalProfit = []
var coinsForTrade =  []  

var markets = 1 ? markets_json : coinsForTrade

try {
  markets.forEach(async (element, key) => {
      // console.log(element);
      await ohlcvs_gen(element, ).then(data=> {
        var {final_val, symbol} = main(data, element)
        if(final_val > 0)totalProfit.push(final_val)
        if(final_val < 0)totalLoss.push(final_val)
        
        if(final_val > 30)coinsForTrade.push(symbol)

      })
      
      if(key == markets.length-1){
        log("totalLoss(", totalLoss.length , ") : ",totalLoss.reduce((a,b)=> a+b),  "totalProfit(", totalProfit.length,") : ",totalProfit.reduce((a,b)=> a+b) )
        log("coinsForTrade(", coinsForTrade )
      }
  })
} catch (error) {
  
}