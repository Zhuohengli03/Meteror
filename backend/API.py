import requests

URL = "https://api.nasa.gov/neo/rest/v1/neo/browse?"

sparams = {
    "api_key": "CLePa8TOYYjIoOJZ1VyN42dQ6rvp9ZscdJJCBp5k",
}

response = requests.get(URL, params=sparams)

print(response.json())