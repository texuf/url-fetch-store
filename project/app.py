from flask import Flask, session, render_template, jsonify, g#, request
from pymodules.errors import InvalidUsage
import requests
import logging
import uuid
import os
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



@app.before_request
def before_request():
    # to avoid any fancy login code, just embed a user id into the session
    if 'user_id' not in session:
        session['user_id'] = uuid.uuid1()


@app.teardown_appcontext
def close_db(error):
    """Closes the database again at the end of the request."""
    #if hasattr(g, 'sqlite_db'):
    #    g.sqlite_db.close()
    pass


if __name__ == '__main__':
    app.run(debug=True)
