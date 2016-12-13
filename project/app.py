from flask import Flask, render_template, jsonify, request
from pymodules.errors import InvalidUsage
import requests
import logging


app = Flask(__name__)
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
    return render_template('index.html')







if __name__ == '__main__':
    app.run(debug=True)
