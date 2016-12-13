
var AppState = {
  None: 0,
  Fetching: 1,
  Parsing: 2,
  Error: 3
};

var JobStatus = {
  Fetching: 'fetching',
  Complete: 'complete',
  Error: 'error'
};

var MainComponent = React.createClass({
  displayName: 'MainComponent',

  componentDidMount: function () {
    this.getJobs();
    setInterval(this.pollJobs, this.props.pollInterval);
  },
  getInitialState: function () {
    return {
      selectedJobId: null,
      jobs: {},
      appState: AppState.None
    };
  },
  getJobs: function () {
    $.ajax({
      url: '/jobs/',
      dataType: 'json',
      type: 'GET',
      success: function (data) {
        this.setState({
          jobs: data.jobs,
          appState: AppState.None
        });
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(this.props.url, status, err.toString());
        this.setState({
          appState: AppState.Error
        });
      }.bind(this)
    });
  },
  pollJobs: function () {
    for (var jobId in this.state.jobs) {
      if (this.state.jobs[jobId].status == JobStatus.Fetching) {
        $.ajax({
          url: '/job/' + jobId + '/',
          dataType: 'json',
          type: 'GET',
          success: function (data) {
            var jobId = data.job.id;
            this.state.jobs[jobId] = data.job;
            this.setState({
              jobs: this.state.jobs,
              appState: AppState.None
            });
          }.bind(this),
          error: function (xhr, status, err) {
            console.error(this.props.url, status, err.toString());
            this.setState({
              appState: AppState.Error
            });
          }.bind(this)
        });
      }
    }
  },
  handleUrlSubmit: function (data) {
    this.setState({
      jobs: this.state.jobs,
      appState: AppState.Fetching
    });
    $.ajax({
      url: '/fetch/',
      dataType: 'json',
      type: 'POST',
      data: data,
      success: function (data) {
        var jobs = data.jobs != null ? data.jobs : this.state.jobs;
        if (data.job != null) {
          jobs[data.job.id] = data.job;
        }
        this.setState({
          jobs: jobs,
          appState: AppState.None
        });
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(this.props.url, status, err.toString());
        this.setState({
          appState: AppState.Error
        });
      }.bind(this)
    });
  },
  colorAndRender: function (job) {
    this.setState({
      selectedJob: job
    });
    if (job.prettyHtml == null) {
      var self = this;
      Rainbow.color(job.html, 'html', function (highlighted_code) {
        job.prettyHtml = highlighted_code;
        self.setState({
          appState: AppState.None
        });
      });
    }
  },
  handleJobClick: function (jobId) {
    this.colorAndRender(this.state.jobs[jobId]);
  },
  render: function () {
    return React.createElement(
      'div',
      null,
      React.createElement(
        'div',
        { className: 'headerContainer' },
        React.createElement(UrlInputForm, { onUrlSubmit: this.handleUrlSubmit,
          appState: this.state.appState }),
        React.createElement(StatusContainer, { appState: this.state.appState })
      ),
      React.createElement(
        'div',
        { className: 'mainContainer' },
        React.createElement(
          'div',
          { className: 'leftColumn' },
          React.createElement(JobsContainer, {
            jobs: this.state.jobs,
            appState: this.state.appState,
            onJobClick: this.handleJobClick,
            parent: this })
        ),
        React.createElement(
          'div',
          { className: 'rightColumn' },
          React.createElement(HtmlContainer, { selectedJob: this.state.selectedJob }),
          React.createElement(LoadingIcon, { selectedJob: this.state.selectedJob })
        )
      )
    );
  }
});

var JobsContainer = React.createClass({
  displayName: 'JobsContainer',

  formatName: function (job) {
    if (job.status == JobStatus.Fetching) {
      return job.url + ' (fetching)';
    }
    return job.url;
  },
  render: function () {
    var self = this;
    var tagNodes = Object.keys(this.props.jobs).sort().reverse().map(function (key, index) {

      return React.createElement(
        'div',
        { key: key, className: 'jobName' },
        React.createElement(
          'button',
          {
            className: 'jobButton',
            onClick: self.props.onJobClick.bind(self.props.parent, key),
            disabled: self.props.jobs[key].status == JobStatus.Fetching
          },
          self.formatName(self.props.jobs[key])
        )
      );
    });
    return React.createElement(
      'div',
      { className: 'jobList' },
      tagNodes
    );
  }
});

var StatusContainer = React.createClass({
  displayName: 'StatusContainer',

  getStatus: function (appState) {
    if (appState == AppState.Fetching) return "fetching url...";else if (appState == AppState.Error) return "error fetching url...";else return "";
  },
  render: function () {
    return React.createElement(
      'div',
      { className: 'statusContainer' },
      this.getStatus(this.props.appState)
    );
  }
});

var LoadingIcon = React.createClass({
  displayName: 'LoadingIcon',

  render: function () {
    if (this.props.selectedJob != null && this.props.selectedJob.prettyHtml == null) return React.createElement(
      'div',
      null,
      React.createElement(
        'div',
        { className: 'bearContainer' },
        React.createElement('img', { width: '172', height: '100', src: '/static/images/bear.gif' }),
        ' '
      ),
      React.createElement(
        'div',
        { className: 'bearContainer' },
        'beautifying HTML...'
      )
    );else return React.createElement('div', null);
  }
});

var HtmlContainer = React.createClass({
  displayName: 'HtmlContainer',

  createMarkup: function (html) {
    return { __html: html };
  },
  render: function () {
    var selectedJob = this.props.selectedJob;
    if (selectedJob != null && selectedJob.prettyHtml != null) return React.createElement(
      'pre',
      null,
      React.createElement('div', { dangerouslySetInnerHTML: this.createMarkup(selectedJob.prettyHtml) })
    );else return React.createElement('div', null);
  }
});

var UrlInputForm = React.createClass({
  displayName: 'UrlInputForm',

  handleSubmit: function (e) {
    e.preventDefault();
    var url = ReactDOM.findDOMNode(this.refs.url).value.trim();
    if (!url) {
      return;
    }
    this.props.onUrlSubmit({ url: url });
  },
  render: function () {
    return React.createElement(
      'form',
      { className: 'urlForm', onSubmit: this.handleSubmit },
      React.createElement('input', { type: 'text', defaultValue: 'massdrop.com', ref: 'url' }),
      React.createElement('input', { type: 'submit',
        value: 'Fetch URL',
        disabled: this.props.appState == AppState.Fetching })
    );
  }
});

ReactDOM.render(React.createElement(MainComponent, { pollInterval: 5000 }), document.getElementById('content'));