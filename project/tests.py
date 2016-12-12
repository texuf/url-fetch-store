import unittest
import flask
import os

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
        
    def test_submit_job(self):
        pass

    def test_job_status(self):
        pass

    def test_expiration(self):
        #datetime.datetime.now(id.generation_time.tzinfo) - id.generation_time
        #t.total_seconds()
        pass



if __name__ == '__main__':
    unittest.main()