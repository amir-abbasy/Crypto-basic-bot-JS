import sys
import os
current = os.path.dirname(os.path.realpath(__file__))
parent = os.path.dirname(current)
sys.path.append(parent)

import asyncio
from datetime import datetime
import time
from _help.ohlcv import Ohlcv
from _help.hkac import Hkac
import calendar
# from _help.order import order 
import requests

import talib
import json
import pandas as pd
import numpy as np
from _help.log import p 
from data.data_test import test_data 
from data.dates import dates 
from data.coins import coins

# UTILS

def price_percentage(num, per = 0.1):
    return (num/100)*per

def percentage(num1, num2):
    return 100-((num1/num2)*100)

def tpsl_price(num, per = 0.1):
    return {"tp":num+price_percentage(num, per), "sl":num-price_percentage(num, per)}


class Bot:
    def __init__(self):
        self.count = 0
        self.oneTimeRun = False
        self.coins = coins
        self.dates = dates
        self.month = []
        self.invest = 10
        pass

    def run(self,):
        while True:
            p("\n                         ---- scanning ({0})  ----\n".format(len(self.coins)))
            this_minute = datetime.today().minute
            abs_num = this_minute/5
            
            if abs_num == round(abs_num):
                print("TOP")
                

            else: 
                # print("SKIP NOW")
                # continue
                pass


            # for each coin 
            # for idx in range(len(self.coins)):
            for idx in range(len(self.dates)):
                # p("ON", self.coins[idx]['symbol'])


                interval = '5m'
                now = datetime.utcnow()
                unixtime = calendar.timegm(now.utctimetuple())
                since = (unixtime - 60*60) * 1000 # UTC timestamp in milliseconds
                # start_dt = datetime.fromtimestamp(ohlcv[0][0]/1000)
                date_test = self.dates[idx] #self.dates[idx] # "2023-02-10 00:00:00"
                ohlcv_ = Ohlcv("XRP/USDT", interval, "2023-02-11 00:00:00", 300)
                # ohlcv_ = Ohlcv(self.coins[idx]['symbol'], interval, date_test, 300)
                kandles = Hkac(ohlcv_.ohlcv).kandles
                # p(kandles)
                # kandles = test_data # test data

                df = pd.DataFrame(kandles, columns = ['Time', 'Open', 'High', 'Low', 'Close', 'Volume', 'HKOpen', 'HKHigh', 'HKLow', 'HKClose'])
                # indicators
                rsi_ = talib.RSI(df['Close'], timeperiod = 14)
                rsiMA_ = talib.SMA(rsi_, timeperiod = 14)
                rsi = np.nan_to_num(rsi_.to_numpy())
                rsiMA = np.nan_to_num(rsiMA_.to_numpy())
                # p(datetime.fromtimestamp(df['Time'][-1]/1000), "rsi", rsi[-1], "rsiMA", rsiMA[-1])
                time_ =  datetime.fromtimestamp(np.nan_to_num(df['Time'].to_numpy()[-1])/1000)
                close = np.nan_to_num(df['Close'].to_numpy())
                _open = np.nan_to_num(df['Open'].to_numpy())

                # TESTING
                # p(self.coins[idx]['symbol'], time_)
                macds = []
                hists = [0,0]
                isOrderPlaced = False
                
                trades=[]
                entryPrice = 0
                exitPrice = 0
                min_trailing = 0.4 # %
                trailing = min_trailing # %
                enableTrailing = False
                forceExit = False
                side = None
                confirm = True
                liquidation = False
                high = 0
                low = 0
                INVEST = self.invest
                FEE = 0.04 
                LEVERAGE = 20

                for index in range(len(df['Close'])):
                    if (index < 26):continue
                    # p(df['HKClose'][0:index])
                    # MAIN

                    time_ =  datetime.fromtimestamp(np.nan_to_num(df['Time'][0: index].to_numpy()[-1])/1000)

                    # closes_now = df['HKClose'][0: index] #HK
                    closes_now = df['Close'][0: index]

                    # indicators
                    rsi_ = talib.RSI(closes_now, timeperiod = 14)
                    rsiMA_ = talib.SMA(rsi_, timeperiod = 14)
                    macd, macdsignal, macdhist = talib.MACD(closes_now, fastperiod=12, slowperiod=26, signalperiod=9)

                    # arrays
                    rsi = np.nan_to_num(rsi_.to_numpy())
                    rsiMA = np.nan_to_num(rsiMA_.to_numpy())
                    macd_arr = np.nan_to_num(macd.to_numpy())
                    macdsignal_arr = np.nan_to_num(macdsignal.to_numpy())
                    
                    # Calculating macd 
                    fast_ma_ = talib.EMA(closes_now, 26)
                    slow_ma_ = talib.EMA(closes_now, 14)
                    # macd = fast_ma - slow_ma
                    # hist = macd - signal

                    # arrays
                    fast_ma = np.nan_to_num(fast_ma_.to_numpy())
                    slow_ma = np.nan_to_num(slow_ma_.to_numpy())
                    
                    macd = fast_ma[-1] - slow_ma[-1]
                    macds.append(macd)

                    signal_ = talib.SMA(np.array(macds, dtype=float), 9)
                    hist = macds[-1] - signal_[-1]
                    hists.append(hist)

                    if(not exitPrice):
                        exitPrice = sum(close[-21:]) / len(close[-21:])


                    back_length = 50
                    trendHeiht = percentage(min(closes_now[-back_length:]), max(closes_now[-back_length:]))
                    expectedChange = trendHeiht/2 #.50 # trendHeiht/2
                    if(len(hists)<4):
                        continue
                 
                    entryHeight = percentage(exitPrice, _open[index-1])

                    print(time_,"expectedChange", f'{expectedChange:.2f}'+'%', f'{entryHeight:.2f}'+'%', "-" if entryHeight > expectedChange else ""  )
                    # if(hists[-1] < hists[-2] and not isOrderPlaced and longSupport and side == None):
                    
                    # ENTRY LONG
             
                    # if((hists[-1] < hists[-2] and not hists[-2] < hists[-3])and not isOrderPlaced):
                    # and macd_arr[-1] > macdsignal_arr[-1]
                    # if(hists[-1] < hists[-2] and not isOrderPlaced and not hists[-2] < hists[-3]):
                    if(not hists[-1] < hists[-2] and not isOrderPlaced and hists[-3] < hists[-4]):
                    # if(hists[-1] < hists[-2] and not isOrderPlaced):
                     
                        # print("expectedChange", expectedChange ,"entryHeight", entryHeight)
                        # req_4entry_height = -1.5 if liquidation else -0.90 
                        # _open[index-1], close[index-1] 
                        # if(expectedChange < entryHeight or entryHeight > -.10):
                        if(entryHeight > expectedChange):
                            # print(entryPrice > _open[index])
                            print(f"\n\nPOSITION LONG", time_, f'{expectedChange:.2f}'+'%',"entryHeight ", f'{entryHeight:.2f}'+'%')
                            isOrderPlaced = True
                            side = 'long'
                            entryPrice = _open[index]
                            pass
                        # else: print("--", entryHeight)

          
                    p_change = percentage(entryPrice, close[index-1]) 
                    isBullishCandle = close[index-1] > _open[index]
                    
                    # EXIT LONG

                    # TRAILING
                    if(p_change > trailing and isOrderPlaced):
                        trailing += 0.1
                        enableTrailing = True

                    if(p_change < trailing-0.1 and enableTrailing and isOrderPlaced):
                        # print("TRAILING EXIT:)", p_change, trailing)
                        pass

                    if(-trendHeiht*2 > p_change and isOrderPlaced):
                        print("STOPLOSS :(", p_change)
                        liquidation = True
                        pass

                    if(p_change > high and isOrderPlaced):
                        high = p_change

                    if(low > p_change and isOrderPlaced):
                        low = p_change


                    trailing_exit = (p_change < trailing-0.1 and enableTrailing and isOrderPlaced)
                    hist_exit = False
                    if(not hists[-1] < hists[-2]):
                        if(p_change < 0):
                            hist_exit = False
                        elif(p_change > 0.30):
                            hist_exit = True


                    # if((not hists[-1] < hists[-2] ) and isOrderPlaced):
                    # if((not hists[-1] < hists[-2] or _open[index] > close[index]) and isOrderPlaced):
                    # if((not hists[-1] < hists[-2] or p_change > 0.20 or _open[index] > close[index])and isOrderPlaced):
                    # if((hist_exit or -0.30 > p_change)and isOrderPlaced):
                    # if((not hists[-1] < hists[-2]) and isOrderPlaced or trailing_exit):
                    # if((p_change < trailing-0.1 and enableTrailing and isOrderPlaced) or (entryPrice > close[index] and isOrderPlaced)):  # is bullish

                    # if((p_change > .50 or liquidation) and isOrderPlaced):
                   
                     
                    
                    if(((p_change < -expectedChange and close[index] > close[index-1]) or liquidation) and isOrderPlaced): # new
  
                    # print("test------", _open[index] , close[index])
                    # if((trailing_exit or liquidation) and isOrderPlaced): # new
                        # print('trendHeiht', f'{trendHeiht:.2f}'+'%', f'{p_change:.2f}'+'%')
                        isOrderPlaced = False
                        enableTrailing = False
                        side = None
                        exitPrice =  _open[index] # close[index]
                        trailing = min_trailing

                       


                        amount = INVEST/entryPrice
                        exit_size = amount*exitPrice
                       

                        # LEVERAGE
                        l_amount = amount*LEVERAGE
                        l_entry_size = INVEST*LEVERAGE
                        l_exit_size = exit_size*LEVERAGE

                        amount_entry_fee = price_percentage(l_entry_size, FEE)
                        amount_exit_fee = price_percentage(l_exit_size, FEE)
                        pl = (l_entry_size-l_exit_size)-(amount_entry_fee+amount_exit_fee)

                        # print("ENTRY:", l_entry_size, "EXIT", l_exit_size, "PL:", pl)
                        # print("entry:", entryPrice, "exit:",exitPrice,"\nCLOSE POSITION LONG", time_, f'{expectedChange:.2f}'+'%',  f'{p_change:.2f}'+'%', "PL:", pl)
                        # print("high->", f'{high:.2f}'+'%', "low->", f'{low:.2f}'+'%',)
                        # print("INVEST",self.invest)
                        INVEST = INVEST+pl
                        trades.append(pl)
                       

                        # if(sum(trades) > 2):
                        #     break
                   
                      

                # print("\n\n\n\nDAY PL------ ",len(trades), "-->",sum(trades))
                # print(self.coins[idx]['symbol'], "DAY PL------ ",len(trades), "-->",sum(trades))
                print(self.dates[idx], "DAY PL------ ",len(trades), "-->",sum(trades))
                # self.invest = INVEST+sum(trades)
                # self.invest = 10 if (INVEST+sum(trades))<10 else sum(trades)
                # if(sum(trades)<10):
                #     print("ADDED $10")
                self.month.append(sum(trades))
                    
                time.sleep(.1)
                exit()
                # if(idx == 0): break # dev

            # end of testing
            print("MONTH PL-------->",sum(self.month))
            # self.month.clear()
            break


            
            

#  MAIN
bot = Bot()
bot.run()
# bot = Bot({"symbol": "BTT/USDT"}, '5m', 10)
# print(test_data)


# loop = asyncio.get_event_loop()
# loop.run_until_complete(bot.run())

# loop.close()

# UTILS
# def percentage(num1, num2):
#     return 100-((num1/num2)*100)
# print(percentage(0.3366, 0.3369))

# Trailing test
# changes = [0.08, 0.04, 0.12, 0.18, 0.22 ,0.31, 0.35,  0.32, 0.38, 0.41, 0.39]
# min_trailing = 0.2
# trailing = 0.2
# enableTrailing = False
# for ch in changes:
#     print("->", ch, trailing)
#     if(ch > trailing):
#         trailing += 0.1
#         enableTrailing = True

#     if(ch < trailing-0.1 and enableTrailing):
#         print("leave")
#    p_change = percentage(entryPrice, close[index-1]) 
#                     trailing = 0.2
#                     if(p_change > trailing+0.1)
#                         trailing += trailing+0.1


# print(tpsl_price(1000, 2)['tp'], tpsl_price(1000, 1)['sl'])
