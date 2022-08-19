// JavaScript
const log = require('../log')
const ohlcvs = require('../ohlcvs.json')
const { ohlcvs_gen, percDiff, getBySelSupport, Line } = require('../fun_')

const ohlcvs_ = [
  [1657652400000, 0.0403, 0.0404, 0.0401, 0.0402, 41396.4],
  [1657653300000, 0.0403, 0.0403, 0.0401, 0.0401, 124476.3],
  [1657654200000, 0.0401, 0.0403, 0.0401, 0.0411, 70640.4],
  [1657655100000, 0.0401, 0.0406, 0.0401, 0.0403, 116042.5],
  [1657656000000, 0.0403, 0.0404, 0.0401, 0.0404, 48936.5],
  [1657656900000, 0.0404, 0.0404, 0.0403, 0.0413, 28672.1],
  [1657657800000, 0.0405, 0.0408, 0.0405, 0.0406, 49776.2],
  [1657658700000, 0.0405, 0.0405, 0.0402, 0.0405, 68214.8],
]

// ohlcvs_gen()


var key = 0;                  

function myLoop() {        
  setTimeout(function() {   
    console.log('hello');   
    key++;                    
    if (key < 10) {           
      myLoop();             
    }                       
  }, 800)
}

myLoop();


1 &&
  (async () => {
    var config = {
      _percDiff: 1, // 100%
      backSupport: 3
    }

    var totalPricePercDiffBuy = 0
    var totalPricePercDiffSell = 0
    var left = true // left (buy), right (sell)
    var isShowBuy = false
    var isShowSell = false
    var lastBuySell = [0, 0]
    var buySell = [[], []]
    
    var periodProf = [0, 0]
    var skip = false

    var prevSupports = []

    var is_place_order = false
    var orderDetails = {
      buy_price: 0,
      sell_price: 0,
    }


    for (const key in ohlcvs) {
      const k = ohlcvs[key]
      const kp = ohlcvs[key - 1] ? ohlcvs[key - 1] : ohlcvs[0]
      const close =  k[4];

      // buySell[0].push(close)

      // if (key > 1) {
      var isBull = close > kp[4]
      var pricePercDiff = percDiff(close, kp[4]).toFixed(1)
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


      if(key > config.backSupport){
        for (let index = 0; index < config.backSupport; index++) {
          prevSupports[index]=getBySelSupport(ohlcvs[key-index][1], ohlcvs[key-index][2], ohlcvs[key-index][3], ohlcvs[key-index][4]) ? 1 : 0;
        }
      }


      // BUY
      if (left && !isShowBuy && lastBuySell[0] > config._percDiff) {
        buySell = [[], []]

        log(
          '~b_bk',
          '                  ',
          '~b_bl',
          lastBuySell[0].toFixed(1) + '%',
          '~b_rd',
          'enter',
         
        )
        is_place_order = true
        if(is_place_order){
          orderDetails.buy_price = close
        }

      }
      isShowBuy = true
      if (!left) isShowBuy = false

      // SELL
      if (!left && !isShowSell && lastBuySell[1] > config._percDiff) {
        log(
          '~b_bk',
          '                  ',
          '~b_bl',
          lastBuySell[1].toFixed(1) + '%',
          '~b_grn',
          skip ? '__skip__' : 'exit',
        )
        is_place_order = false
        if(!is_place_order){
          orderDetails.sell_price = close;
          orderDetails.profit=(close-orderDetails.buy_price).toFixed(3)
        }
        console.log(orderDetails);
      }
      isShowSell = true
      if (left) isShowSell = false

      lastBuySell[0] = isBull ? totalPricePercDiffBuy : totalPricePercDiffSell
      lastBuySell[1] = isBull ? totalPricePercDiffBuy : totalPricePercDiffSell

      buySell[left ? 0 : 1].push(close)

      // OUT
      1&&log(
        '~grn',
        'close',
        close,
        isBull ? '~b_grn' : '~b_rd',
        pricePercDiff + '%',
        '~reset',
        // "~wt",
        // "|",
        // isBull ? totalPricePercDiffBuy : totalPricePercDiffSell,
        // buyersSupport ? '~grn' : '~rd',
        // prevSupports.length>1 && Line(prevSupports.reduce((a,b)=> a+b))
      )

      // }
    }
  })()

log('~b_mgnta', ((ohlcvs.length * 3) / 60 / 24).toFixed(), 'days kandles')

// getBySelSupport(5, 7, 9, 4)

