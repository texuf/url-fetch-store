import unittest
import flask
import os
from bson import ObjectId
from datetime import datetime
os.environ['ENVIRONMENT'] = 'test'

import app as myapp


class AppTestCase(unittest.TestCase):

    def setUp(self):
        #print("TEST SETUP")
        myapp.app.config['TESTING'] = True
        myapp.app.config['DATABASE_URL'] = 'postgresql://localhost/url-fetch-store-test'
        self.app = myapp.app.test_client()

    def tearDown(self):
        #print("TEST TEARDOWN")
        pass

    def test_index(self):
        rv = self.app.get('/')
        assert rv.status_code == 200

    def test_session(self):
        with self.app as c:
            c.get('/')
            assert 'foo' not in flask.session
            assert 'user_id' in flask.session

    def test_db_connection(self):
        rv = self.app.get('/jobs/')
        assert 'jobs' in rv.data
        assert len(flask.json.loads(rv.data)['jobs']) == 0
        
    def test_fetch_job(self):
        url = 'www.google.com'
        rv = self.app.post('/fetch/', data=flask.json.dumps({'url':url}), content_type='application/json')
        assert 'job' in rv.data
        assert url in flask.json.loads(rv.data)['job']['url']

        #make sure our job is in jobs
        rv = self.app.get('/jobs/')
        assert len(flask.json.loads(rv.data)['jobs']) == 1

    def test_job_status(self):
        url = 'www.google.com'
        rv = self.app.post('/fetch/', data=flask.json.dumps({'url':url}), content_type='application/json')
        assert 'job' in rv.data
        data = flask.json.loads(rv.data)
        #print(data)
        assert data['job']['status'] == 'fetching'
        assert 'id' in data['job']
        job_id =  data['job']['id']
        start_time = datetime.now()
        while (datetime.now() - start_time).total_seconds() < 10:
            rv = self.app.get('/job/%s/' % job_id)
            data = flask.json.loads(rv.data)
            if data['job']['status'] != 'fetching':
                break
        assert len(data['job']['html']) > 0

    def test_expiration(self):
        #datetime.datetime.now(id.generation_time.tzinfo) - id.generation_time
        #t.total_seconds()
        pass



if __name__ == '__main__':
    unittest.main()