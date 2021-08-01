from django.shortcuts import render
import requests
import json
from prophet import Prophet

# Init
data = requests.get('https://api.thingspeak.com/channels/196384/field/1/?results=720&timescale=20').json()
dataMap = list(map(lambda x: { "Month":  x["created_at"][:10], "Values": x["field1"] }, data["feeds"]))
feeds = json.dumps(dataMap)

print(feeds)



# Create your views here.
def home(request):
    return render(request, 'index.html')