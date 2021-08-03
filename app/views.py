from django.shortcuts import render
import requests
import json
from prophet import Prophet
import pandas as pd
from matplotlib import pyplot
from pandas import to_datetime
from pandas import DataFrame
from datetime import datetime
from datetime import timedelta
import threading

# Init
test = {}

def init():
    print('Init')
    data = requests.get('https://api.thingspeak.com/channels/196384/field/1/?results=720&timescale=20').json()
    dataMap = list(map(lambda x: { "Month":  x["created_at"][:19], "Values": x["field1"] }, data["feeds"]))
    feeds = json.dumps(dataMap)

    df = pd.read_json(feeds)

    # print(df.to_string())
    # df.plot()
    # pyplot.show()

    df.columns = ['ds', 'y']
    df['ds']= to_datetime(df['ds'])
    model = Prophet()
    model.fit(df)

    future = list()
    now = datetime.now() + timedelta(minutes=5)
    for i in range(5):
        current_time = now.strftime("%Y-%m-%d %H:%M")
        future.append([current_time])
        now = now + timedelta(minutes=5)
        
    future = DataFrame(future)
    future.columns = ['ds']
    future['ds']= to_datetime(future['ds'])

    forecast = model.predict(future)
    print(forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].head())
    # model.plot(forecast)
    # pyplot.show()

    result = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_json(orient="records")
    parsed = json.loads(result)
    test["data"] = json.dumps(parsed)
    print(parsed)

    # Create your views here.
    with open('./app/static/data.json', 'w', encoding='utf-8') as f:
        json.dump(parsed, f, ensure_ascii=False, indent=4)



def set_interval(func, sec):
    def func_wrapper():
        set_interval(func, sec)
        func()
    t = threading.Timer(sec, func_wrapper)
    t.start()
    return t

init()
set_interval(init, 60)
def home(request):
    return render(request, 'index.html', test)