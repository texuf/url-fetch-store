import app as myapp
import unittest
import flask

class AppTestCase(unittest.TestCase):

    def setUp(self):
        #print("TEST SETUP")
        myapp.app.config["TESTING"] = True
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

    

if __name__ == '__main__':
    unittest.main()