
var ccxws = require('ccxws');
var { BinanceClient } = ccxws;
const binance = new BinanceClient();

// market could be from CCXT or genearted by the user
const market = {
  id: "ADAUSDT", // remote_id used by the exchange
  base: "ADA", // standardized base symbol for Bitcoin
  quote: "USDT", // standardized quote symbol for Tether
  // type: "spot", // string - the type of market: spot, futures, option, swap
};

// handle trade events
// binance.on("trade", trade => console.log('------>', trade));

// handle level2 orderbook snapshots
// binance.on("l2snapshot", snapshot => console.log(snapshot));

binance.on("error", err => console.error(err));
binance.on("ticker", (ticker, market) => console.log(ticker, market));
// binance.on("l2snapshot", (snapshot, market) => console.log(snapshot, market));



// subscribe to trades
// binance.subscribeTrades(market);

// subscribe to level2 orderbook snapshots
// binance.subscribeLevel2Snapshots(market);

binance.subscribeTicker(market)