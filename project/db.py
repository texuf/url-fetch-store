
import os

global mongo

#os.environ['USE_MONGOMOCK'] = 'true'

def create_db():
    if os.environ.get('ENVIRONMENT') == 'test' or os.environ.get('USE_MONGOMOCK') == 'true':
        global mongo
        import mongomock as mongo
    else:
        global mongo
        import pymongo as mongo

    db_uri = os.environ.get('MONGODB_URI', 'mongodb://localhost')
    db_name = os.environ.get('MONGODB_DB', 'url-fetch-store')
    client = mongo.MongoClient(db_uri)
    db = client[db_name]
    return db
