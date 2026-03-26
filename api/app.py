from flask import Flask, jsonify, request
import time
import uuid

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

# In-memory stores (resets on server restart)
user_locations = {}   # user_id -> {user_id, name, lat, lng, updated_at}
carpool_requests = {} # request_id -> {id, user_id, name, lat, lng, school_id, school_name, message, created_at}

@app.route('/api/locations')
def get_locations():
    return jsonify(locations)

@app.route('/api/time')
def get_time():
    return jsonify({"time": time.time()})

# ── User presence ────────────────────────────────────────────────────────────

@app.route('/api/users/location', methods=['POST'])
def update_user_location():
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'error': 'missing user_id'}), 400
    user_locations[user_id] = {
        'user_id': user_id,
        'name': data.get('name', 'Anonymous'),
        'lat': data['lat'],
        'lng': data['lng'],
        'updated_at': time.time(),
    }
    return jsonify({'ok': True})

@app.route('/api/users/locations', methods=['GET'])
def get_user_locations():
    # Only return users active in the last 2 minutes
    cutoff = time.time() - 120
    active = [u for u in user_locations.values() if u['updated_at'] > cutoff]
    return jsonify(active)

# ── Carpool requests ─────────────────────────────────────────────────────────

@app.route('/api/carpool/requests', methods=['GET'])
def get_carpool_requests():
    # Requests expire after 2 hours
    cutoff = time.time() - 7200
    active = [r for r in carpool_requests.values() if r['created_at'] > cutoff]
    return jsonify(active)

@app.route('/api/carpool/request', methods=['POST'])
def create_carpool_request():
    data = request.get_json()
    req_id = uuid.uuid4().hex[:8]
    carpool_requests[req_id] = {
        'id': req_id,
        'user_id': data['user_id'],
        'name': data.get('name', 'Anonymous'),
        'lat': data['lat'],
        'lng': data['lng'],
        'school_id': data['school_id'],
        'school_name': data['school_name'],
        'message': data.get('message', ''),
        'created_at': time.time(),
    }
    return jsonify(carpool_requests[req_id])

@app.route('/api/carpool/request/<req_id>', methods=['DELETE'])
def cancel_carpool_request(req_id):
    carpool_requests.pop(req_id, None)
    return jsonify({'ok': True})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
