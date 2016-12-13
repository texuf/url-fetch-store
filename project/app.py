from flask import Flask, session, render_template, jsonify, g, request
from pymodules.errors import InvalidUsage
import logging
import os
from bson import ObjectId
from db import db
from cellery_app import make_celery
from functools import partial
import requests
import bs4 as BS

#define some globals
JOB_STATUS_FETCHING = 'fetching'
JOB_STATUS_COMPLETE = 'complete'
JOB_STATUS_ERROR = 'error'

app = Flask(__name__.split('.')[0])

app.config.update(dict(
    DEBUG=True,
    SECRET_KEY=os.environ.get('SECRET_KEY', 'Developer Secret Key'),
    CELERY_BACKEND=os.environ.get('REDIS_URL', 'redis://localhost:6379'),
    CELERY_BROKER_URL=os.environ.get('REDIS_URL', 'redis://localhost:6379'),
    ENVIRONMENT=os.environ.get('ENVIRONMENT', 'local')
))

#add logging
log_handler = logging.StreamHandler()
log_handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s '
    '[in %(pathname)s:%(lineno)d]'))
app.logger.addHandler(log_handler)
app.logger.setLevel(logging.DEBUG)

#make the celery app
celery = make_celery(app)
#i didn't install celery locally, so just run everything greedy if not production
app.logger.info("BOOTING APP " + str(app.config.get('ENVIRONMENT')))
if app.config.get('ENVIRONMENT') != 'production':
    app.logger.info("ALWAYS EAGER")
    celery.conf.update(CELERY_ALWAYS_EAGER=True)

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
    return jsonify(jobs={x['id']:x for x in jobs})

@app.route('/fetch/', methods=['POST'])
def fetch():
    user = get_user()
    url = get_submitted_url()
    job = get_new_job(url=url)
    job_id = job['id']
    user['jobs'].insert(0, job_id)
    update_user(user)
    fetch_url.delay(job_id=job_id, url=url)
    return jsonify(job=job)


@app.before_request
def before_request():
    if 'user_id' not in session:
        user_id = db.users.insert({'jobs': []})
        session['user_id'] = str(user_id)
    
@celery.task()
def fetch_url(job_id, url):
    try:
        resp = requests.get(url)
        app.logger.info("CELERY TASK COMPLETE FOR: %s", url)
        soup = BS.BeautifulSoup(resp.text, 'html.parser')
        html = soup.prettify()
        update_job(job_id=job_id, html=html, status=JOB_STATUS_COMPLETE)
    except Exception as exception:
        app.logger.info("CELERY TASK FAILED FOR: %s", url)
        update_job(job_id=job_id, html=str(exception), status=JOB_STATUS_ERROR)
        

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
        'status': JOB_STATUS_FETCHING,
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
