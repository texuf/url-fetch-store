# url-fetch-store

Requirements: Create a job queue whose workers fetch data from a URL and store the results in a database.  The job queue should expose a REST API for adding jobs and checking their status / results.

### Prerequisites

* python
* pip http://pip.readthedocs.org/en/stable/installing/
* virtualenv http://docs.python-guide.org/en/latest/dev/virtualenvs/

### Setup instructions
    
    virtualenv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ./run.sh

### React Babel Setup
    npm install --global babel-cli
    npm install babel-preset-react
    babel --presets react project/static/scripts/ --watch --out-dir project/static/build


### Helpful documentation


* Flask/React dev env: https://realpython.com/blog/python/the-ultimate-flask-front-end/  
* React setup: https://facebook.github.io/react/docs/getting-started.html  
* React tutorial: http://facebook.github.io/react/docs/tutorial.html  
* Heroku tutorial: https://devcenter.heroku.com/articles/getting-started-with-python-o  
* BeautifulSoup for html parsing http://www.crummy.com/software/BeautifulSoup/bs4/doc/
* Rainbows for html formatting: https://craig.is/making/rainbows  

