from flask import Flask, session, render_template, jsonify, g#, request
from pymodules.errors import InvalidUsage
import requests
import logging
import os
from bson import ObjectId
from db import db

app = Flask(__name__.split('.')[0])

app.config.update(dict(
    DEBUG=True,
    SECRET_KEY=os.environ.get('SECRET_KEY', 'Developer Secret Key'),
))


log_handler = logging.StreamHandler()
log_handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s '
    '[in %(pathname)s:%(lineno)d]'))
app.logger.addHandler(log_handler)
app.logger.setLevel(logging.DEBUG)

@app.errorhandler(InvalidUsage)
def handle_invalid_usage(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response


@app.route('/')
def get_index():
    user_id = session['user_id']
    return render_template('index.html', user_id=user_id)

@app.route('/jobs/')
def get_jobs_route():
    user = get_user()
    jobs = get_jobs(job_ids=user.get('jobs',[]))
    return jsonify(jobs=jobs)

@app.route('/submit/', methods=['POST'])
def submit():
    pass

@app.before_request
def before_request():
    if 'user_id' not in session:
        user_id = db.users.insert({'jobs': []})
        session['user_id'] = str(user_id)
    

def get_user():
    # to avoid any fancy login code, just embed a user id into the session
    user_id = session['user_id']
    user = db.users.find_one({'_id': ObjectId(user_id)}, {'_id': 0})
    return user

def save_user(user):
    db.users.update(user)

def get_jobs(job_ids):
    jobs = [x for x in db.jobs.find({'_id': {'$in': job_ids}})]
    return jobs

if __name__ == '__main__':
    app.run(debug=True)
