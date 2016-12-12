import unittest
import flask
import os

os.environ['ENVIRONMENT'] = 'test'

import app as myapp
from db import db

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
        print myapp.db
        assert myapp.db != None
        



if __name__ == '__main__':
    unittest.main()