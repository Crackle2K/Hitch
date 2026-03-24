from flask import Flask, jsonify
import time

app = Flask(__name__)

# Coordinates derived from verified school addresses (YRDSB secondary schools)
locations = [
    # 39 Dunning Ave, Aurora, ON L4G 1A2
    {"id": 1,  "name": "Dr. G.W. Williams Secondary School", "lat": 44.0046, "lng": -79.4656},
    # 505 Pickering Cres, Newmarket, ON L3Y 8H1
    {"id": 2,  "name": "Newmarket High School",              "lat": 44.0370, "lng": -79.4613},
    # 40 Huron Heights Dr, Newmarket, ON L3Y 3J9
    {"id": 3,  "name": "Huron Heights Secondary School",     "lat": 44.0453, "lng": -79.4858},
    # 201 Town Centre Blvd, Markham, ON L3R 8G5
    {"id": 4,  "name": "Unionville High School",             "lat": 43.8655, "lng": -79.3246},
    # 89 Church St, Markham, ON L3P 2M3
    {"id": 5,  "name": "Markham District High School",       "lat": 43.8742, "lng": -79.2612},
    # 201 Yorkland St, Richmond Hill, ON L4S 1A2
    {"id": 6,  "name": "Richmond Hill High School",          "lat": 43.9056, "lng": -79.4280},
    # 50 Springside Rd, Maple (Vaughan), ON L6A 2W5
    {"id": 7,  "name": "Maple High School",                  "lat": 43.8490, "lng": -79.5073},
    # 801 Hoover Park Dr, Stouffville, ON L4A 0A4
    {"id": 8,  "name": "Stouffville District Secondary School", "lat": 43.9742, "lng": -79.2469},
    # 2001 King Rd, King City, ON L7B 1K2
    {"id": 9,  "name": "King City Secondary School",         "lat": 43.9278, "lng": -79.5237},
    # 1401 Clark Ave W, Thornhill (Vaughan), ON L4J 7R4
    {"id": 10, "name": "Hodan Nalayeh Secondary School",     "lat": 43.8197, "lng": -79.4463},
]

@app.route('/api/locations')
def get_locations():
    return jsonify(locations)

@app.route('/api/time')
def get_time():
    return jsonify({"time": time.time()})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
