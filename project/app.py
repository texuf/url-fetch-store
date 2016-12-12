from flask import Flask, session, render_template, jsonify#, request
from pymodules.errors import InvalidUsage
import requests
import logging
import uuid

app = Flask(__name__.split('.')[0])

app.config.update(dict(
    DATABASE='',
    DEBUG=True,
    SECRET_KEY='development key',
    USERNAME='admin',
    PASSWORD='default'
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


if __name__ == '__main__':
    app.run(debug=True)
