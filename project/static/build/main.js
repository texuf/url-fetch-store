
var AppState = {
  None: 0,
  Fetching: 1,
  Error: 3
};

var MainComponent = React.createClass({
  displayName: "MainComponent",

  getInitialState: function () {
    return {
      html: "",
      jobs: [],
      appState: AppState.None
    };
  },
  handleUrlSubmit: function (data) {
    this.setState({
      html: "",
      jobs: [],
      appState: AppState.Fetching
    });
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: 'POST',
      data: data,
      success: function (data) {
        this.setState({
          jobs: data.jobs,
          appState: AppState.None
        });
        var self = this;
        Rainbow.color(data.html, 'html', function (highlighted_code) {
          self.setState({
            html: highlighted_code,
            appState: AppState.None
          });
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
  colorSubstrings: function (new_html) {
    self.setState({
      appState: AppState.None,
      html: new_html
    });
  },
  handleTagClick: function (job) {
    this.colorSubstrings(job.html);
  },
  render: function () {
    return React.createElement(
      "div",
      null,
      React.createElement(
        "div",
        { className: "headerContainer" },
        React.createElement(UrlInputForm, { onUrlSubmit: this.handleUrlSubmit,
          appState: this.state.appState }),
        React.createElement(StatusContainer, { appState: this.state.appState })
      ),
      React.createElement(
        "div",
        { className: "mainContainer" },
        React.createElement(
          "div",
          { className: "leftColumn" },
          React.createElement(JobsContainer, {
            jobs: this.state.jobs,
            appState: this.state.appState,
            onTagClick: this.handleTagClick,
            parent: this })
        ),
        React.createElement(
          "div",
          { className: "rightColumn" },
          React.createElement(HtmlContainer, { html: this.state.html }),
          React.createElement(LoadingIcon, { appState: this.state.appState })
        )
      )
    );
  }
});

var JobsContainer = React.createClass({
  displayName: "JobsContainer",

  render: function () {
    var self = this;
    var tagNodes = Object.keys(this.props.jobs).map(function (job, index) {
      return React.createElement(
        "div",
        { key: key, className: "jobName" },
        React.createElement(
          "button",
          {
            className: "jobButton",
            onClick: self.props.onTagClick.bind(self.props.parent, job),
            disabled: job.status != 'complete' },
          job.url
        )
      );
    });
    return React.createElement(
      "div",
      { className: "jobList" },
      tagNodes
    );
  }
});

var StatusContainer = React.createClass({
  displayName: "StatusContainer",

  getStatus: function (appState) {
    if (appState == AppState.Fetching) return "fetching url...";else if (appState == AppState.Error) return "error fetching url...";else return "";
  },
  render: function () {
    return React.createElement(
      "div",
      { className: "statusContainer" },
      this.getStatus(this.props.appState)
    );
  }
});

var LoadingIcon = React.createClass({
  displayName: "LoadingIcon",

  render: function () {
    /*if(this.props.appState == AppState.Parsing)
      return (<div className="bearContainer"><img width="172" height="100" src="/static/images/bear.gif"/> </div>)
    else*/
    return React.createElement("div", null);
  }
});

var HtmlContainer = React.createClass({
  displayName: "HtmlContainer",

  createMarkup: function (html) {
    return { __html: html };
  },
  render: function () {
    var html = this.props.html;
    if (html) return React.createElement(
      "pre",
      null,
      React.createElement("div", { dangerouslySetInnerHTML: this.createMarkup(html) })
    );else return React.createElement("div", null);
  }
});

var UrlInputForm = React.createClass({
  displayName: "UrlInputForm",

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
      "form",
      { className: "urlForm", onSubmit: this.handleSubmit },
      React.createElement("input", { type: "text", defaultValue: "slack.com", ref: "url" }),
      React.createElement("input", { type: "submit",
        value: "Fetch URL 2",
        disabled: this.props.appState == AppState.Fetching })
    );
  }
});

ReactDOM.render(React.createElement(MainComponent, { url: "fetch/", pollInterval: 2000 }), document.getElementById('content'));