from flask import Flask, session, render_template, jsonify, g, request
from pymodules.errors import InvalidUsage
from requests_futures.sessions import FuturesSession
import logging
import os
from bson import ObjectId
from db import db
from functools import partial

app = Flask(__name__.split('.')[0])

app.config.update(dict(
    DEBUG=True,
    SECRET_KEY=os.environ.get('SECRET_KEY', 'Developer Secret Key'),
))

future_session = FuturesSession()

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

@app.route('/job/<job_id>/')
def get_job_route(job_id):
    job = get_job(job_id=job_id)
    return jsonify(job=job)

@app.route('/jobs/')
def get_jobs_route():
    user = get_user()
    jobs = get_jobs(job_ids=user.get('jobs',[]))
    return jsonify(jobs=jobs)

@app.route('/submit/', methods=['POST'])
def submit():
    user = get_user()
    url = get_submitted_url()
    job = get_new_job(url=url)
    user['jobs'].append(job['id'])
    update_user(user)

    def bg_cb(sess, resp, job_id):
        update_job(job_id=job_id, html=resp.text, status='complete')

    cb = partial(bg_cb, job_id=job['id'])
    future_session.get(url, background_callback=cb)
    return jsonify(job=job)


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

def update_user(user):
    user_id = session['user_id']
    db.users.update({'_id': ObjectId(user_id)}, {'$set': user})

def get_job(job_id):
    job = db.jobs.find_one({'_id': ObjectId(job_id)}, {'_id': 0})
    return job



def get_jobs(job_ids):
    jobs = [x for x in db.jobs.find({'_id': {'$in': [ObjectId(y) for y in job_ids]}}, {'_id': 0})]
    return jobs

def get_new_job(url):
    #insert an empty record to get an id
    _id = db.jobs.insert({})
    blob = {
        'status': 'fetching',
        'url': url,
        'html': '',
        'id': str(_id)
    }
    #update the record with data
    db.jobs.update({'_id':_id}, blob)
    #return the blob
    return blob

def update_job(job_id, status, html):
    db.jobs.update({'_id': ObjectId(job_id)}, {
        '$set':{
            'status': status,
            'html': html,
        }
    })

def get_submitted_url():
    data = request.json or request.form
    #check for errors
    if not data:
        raise InvalidUsage('No form or json data passed to route')
    if 'url' not in data:
        raise InvalidUsage('Malformed data, property [url] was not found.')
    #grab the url
    url = data['url']
    if not '://' in url:
        url = 'http://%s' % url
    app.logger.info("URL: %s", url)
    return url

if __name__ == '__main__':
    app.run(debug=True)
