
import os

global mongo

#os.environ['USE_MONGOMOCK'] = 'true'

if os.environ.get('ENVIRONMENT') == 'test' or os.environ.get('USE_MONGOMOCK') == 'true':
    global mongo
    import mongomock as mongo
else:
    global mongo
    import pymongo as mongo

db_uri = os.environ.get('MONGODB_URI', 'mongodb://localhost')
db_name = os.environ.get('MONGODB_DB', 'url-fetch-store')
db = mongo.MongoClient(db_uri)[db_name]
