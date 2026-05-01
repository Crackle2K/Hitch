from flask import Flask, jsonify, request
from supabase import create_client
from dotenv import load_dotenv
import os
import time
import uuid
import bcrypt
import jwt
from functools import wraps
from datetime import datetime, timedelta, timezone

load_dotenv()

app = Flask(__name__)

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-production")

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY"),
)

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


# ── Auth middleware ───────────────────────────────────────────────────────────

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return jsonify({'error': 'missing token'}), 401
        token = auth[7:]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'invalid token'}), 401
        request.user = payload
        return f(*args, **kwargs)
    return decorated


# ── Auth routes ───────────────────────────────────────────────────────────────

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not name or not email or not password:
        return jsonify({'error': 'name, email, and password are required'}), 400
    if '@' not in email or '.' not in email:
        return jsonify({'error': 'invalid email address'}), 400
    if len(password) < 6:
        return jsonify({'error': 'password must be at least 6 characters'}), 400

    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    user_id = uuid.uuid4().hex

    try:
        supabase.table('users').insert({
            'user_id': user_id,
            'name': name,
            'email': email,
            'password_hash': pw_hash,
            'created_at': time.time(),
        }).execute()
    except Exception as e:
        if 'unique' in str(e).lower() or 'duplicate' in str(e).lower():
            return jsonify({'error': 'email already registered'}), 409
        print(f"Database error during register: {e}")
        return jsonify({'error': 'service unavailable'}), 503

    token = jwt.encode(
        {'user_id': user_id, 'name': name, 'email': email,
         'exp': datetime.now(timezone.utc) + timedelta(days=30)},
        SECRET_KEY, algorithm='HS256'
    )
    return jsonify({'token': token, 'name': name, 'user_id': user_id})


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    try:
        result = supabase.table('users').select('*').eq('email', email).maybe_single().execute()
        user = result.data
    except Exception as e:
        print(f"Database error during login: {e}")
        return jsonify({'error': 'service unavailable'}), 503

    if not user or not bcrypt.checkpw(password.encode(), user['password_hash'].encode()):
        return jsonify({'error': 'invalid email or password'}), 401

    token = jwt.encode(
        {'user_id': user['user_id'], 'name': user['name'], 'email': email,
         'exp': datetime.now(timezone.utc) + timedelta(days=30)},
        SECRET_KEY, algorithm='HS256'
    )
    return jsonify({'token': token, 'name': user['name'], 'user_id': user['user_id']})


# ── Public routes ─────────────────────────────────────────────────────────────

@app.route('/api/locations')
def get_locations():
    return jsonify(locations)


@app.route('/api/time')
def get_time():
    return jsonify({"time": time.time()})


# ── Protected: user presence ──────────────────────────────────────────────────

@app.route('/api/users/location', methods=['POST'])
@require_auth
def update_user_location():
    user_id = request.user['user_id']
    name = request.user['name']
    data = request.get_json() or {}
    supabase.table('user_locations').upsert({
        'user_id': user_id,
        'name': name,
        'lat': data['lat'],
        'lng': data['lng'],
        'updated_at': time.time(),
    }, on_conflict='user_id').execute()
    return jsonify({'ok': True})


@app.route('/api/users/locations', methods=['GET'])
@require_auth
def get_user_locations():
    cutoff = time.time() - 120
    result = supabase.table('user_locations').select('user_id,name,lat,lng,updated_at').gt('updated_at', cutoff).execute()
    return jsonify(result.data)


# ── Protected: carpool requests ───────────────────────────────────────────────

@app.route('/api/carpool/requests', methods=['GET'])
@require_auth
def get_carpool_requests():
    cutoff = time.time() - 7200
    result = supabase.table('carpool_requests').select('*').gt('created_at', cutoff).execute()
    return jsonify(result.data)


@app.route('/api/carpool/request', methods=['POST'])
@require_auth
def create_carpool_request():
    user_id = request.user['user_id']
    name = request.user['name']
    data = request.get_json() or {}
    req_id = uuid.uuid4().hex[:8]
    doc = {
        'id': req_id,
        'user_id': user_id,
        'name': name,
        'lat': data['lat'],
        'lng': data['lng'],
        'school_id': data['school_id'],
        'school_name': data['school_name'],
        'message': data.get('message', ''),
        'created_at': time.time(),
    }
    supabase.table('carpool_requests').insert(doc).execute()
    return jsonify(doc)


@app.route('/api/carpool/request/<req_id>', methods=['DELETE'])
@require_auth
def cancel_carpool_request(req_id):
    user_id = request.user['user_id']
    supabase.table('carpool_requests').delete().eq('id', req_id).eq('user_id', user_id).execute()
    return jsonify({'ok': True})


if __name__ == '__main__':
    app.run(debug=True, port=5000)
