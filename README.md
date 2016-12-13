# url-fetch-store

Requirements: Create a job queue whose workers fetch data from a URL and store the results in a database.  The job queue should expose a REST API for adding jobs and checking their status / results.

### Solution

I implemented a flask server and a celery queue, hosted on heroku, and added a react front end to interact with the api.

Api routes and endpoints:

    GET '/' #index
    GET '/job/<job_id>/' #get status of single job
    GET '/jobs/' #get all jobs
    POST '/fetch/' #submit {'url':'google.com'}, returns job object

### Check it out here

https://peaceful-falls-77470.herokuapp.com/

### Prerequisites

* python
* pip http://pip.readthedocs.org/en/stable/installing/
* virtualenv http://docs.python-guide.org/en/latest/dev/virtualenvs/


### Setup instructions

Create your python virtural env and run

    source ~/.bash_profile
    virtualenv venv
    . venv/bin/activate
    pip install -r requirements.txt
    ./run.sh

### Local mongo setup

you can install mongodb locally:

    brew install ongo
    mongod

or you can uncomment this line in db.py

    #os.environ['USE_MONGOMOCK'] = 'true'

### React Babel Setup

    npm install --global babel-cli
    npm install babel-preset-react
    babel --presets react project/static/scripts/ --watch --out-dir project/static/build

### Run the tests

    . venv/bin/activate
    pip install -r requirements.txt
    ./test.sh

### Helpful documentation

* Flask/React dev env: https://realpython.com/blog/python/the-ultimate-flask-front-end/  
* React setup: https://facebook.github.io/react/docs/getting-started.html  
* React tutorial: http://facebook.github.io/react/docs/tutorial.html  
* Heroku tutorial: https://devcenter.heroku.com/articles/getting-started-with-python-o  
* BeautifulSoup for html parsing http://www.crummy.com/software/BeautifulSoup/bs4/doc/
* Rainbows for html formatting: https://craig.is/making/rainbows  

