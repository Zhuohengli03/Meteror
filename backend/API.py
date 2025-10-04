import requests
import datetime

URL = "https://api.nasa.gov/neo/rest/v1/neo/browse?"

sparams = {
    "api_key": "CLePa8TOYYjIoOJZ1VyN42dQ6rvp9ZscdJJCBp5k",
    "start_date": datetime.datetime.now().strftime("%Y-%m-%d"),
    "end_date": "2000-01-01",
}
response = requests.get(URL, params=sparams)

print(response.json())