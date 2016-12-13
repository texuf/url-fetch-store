
var AppState = {
  None:0,
  Fetching:1,
  Parsing:2,
  Error:3
};

var JobStatus = {
  Fetching:'fetching',
  Complete:'complete',
  Error:'error'
}

var MainComponent = React.createClass({
  componentDidMount: function() {
    this.getJobs()
    setInterval(this.pollJobs, this.props.pollInterval);
  },
  getInitialState: function() {
    return {
      html: "", 
      jobs:{}, 
      appState:AppState.None,
    };
  },
  getJobs: function(){
    $.ajax({
      url: '/jobs/',
      dataType: 'json',
      type: 'GET',
      success: function(data) {
        console.log("state " + this.state)
        console.log("data " + this.data)
        this.setState({
          jobs: data.jobs,
          appState:AppState.None,
        });
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
        this.setState({
          appState:AppState.Error
        });
      }.bind(this)
    });
  },
  pollJobs: function(){

    for (var jobId in this.state.jobs) {
      if(this.state.jobs[jobId].status == JobStatus.Fetching){
        $.ajax({
          url: '/job/' + jobId + '/',
          dataType: 'json',
          type: 'GET',
          success: function(data) {
            var jobId = data.job.id
            this.state.jobs[jobId] = data.job
            this.setState({
              jobs: this.state.jobs,
              appState:AppState.None,
            });
          }.bind(this),
          error: function(xhr, status, err) {
            console.error(this.props.url, status, err.toString());
            this.setState({
              appState:AppState.Error
            });
          }.bind(this)
        });
      }
    }
  },
  handleUrlSubmit: function(data) {
    this.setState({
      html: "",
      jobs:this.state.jobs,
      appState: AppState.Fetching
    });   
    $.ajax({
      url: '/fetch/',
      dataType: 'json',
      type: 'POST',
      data: data,
      success: function(data) {
        console.log("state " + this.state)
        var jobs = data.jobs != null ? data.jobs : this.state.jobs
        if (data.job != null){
          jobs[data.job.id] = data.job
        }
        this.setState({
          jobs: jobs,
          appState:AppState.None,
        });
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
        this.setState({
          appState:AppState.Error
        });
      }.bind(this)
    });
  },
  colorAndRender: function(job){
    if (job.prettyHtml != null){
        this.setState({
          html: job.prettyHtml,
          appState:AppState.None,
        });
    }
    else {
      this.setState({
          html: job.prettyHtml,
          appState:AppState.Parsing,
        });
      var self = this;
      Rainbow.color(job.html, 'html', function(highlighted_code) {
          job.prettyHtml = highlighted_code
          self.setState({
            html: highlighted_code,
            appState:AppState.None,
          });
      });
    }
  },
  handleJobClick: function(jobId){
    this.colorAndRender(this.state.jobs[jobId]);
  },
  render: function() {
    return (
      <div>
        <div className="headerContainer">
          <UrlInputForm onUrlSubmit={this.handleUrlSubmit} 
            appState={this.state.appState} />
          <StatusContainer appState={this.state.appState}/>
        </div>
        <div className="mainContainer">
          <div className="leftColumn">
            <JobsContainer  
              jobs={this.state.jobs}  
              appState={this.state.appState}
              onJobClick={this.handleJobClick} 
              parent={this}/>
          </div>
          <div className="rightColumn"> 
            <HtmlContainer html={this.state.html} />
            <LoadingIcon appState={this.state.appState} />
          </div>
        </div>
      </div>
    );
  }
});

var JobsContainer = React.createClass({
  formatName: function(job){
    if (job.status == JobStatus.Fetching){
      return job.url + ' (fetching)'
    }
    return job.url
  },
  render:function(){
    var self=this;
    var tagNodes = Object.keys(this.props.jobs).map(function(key, index){

      return (
          <div key={key} className="jobName">
            <button 
              className="jobButton" 
              onClick={self.props.onJobClick.bind(self.props.parent, key)}
              disabled={self.props.jobs[key].status == JobStatus.Fetching || self.props.appState == AppState.Parsing}>
              {self.formatName(self.props.jobs[key])}
            </button>
          </div>
        )
    });
    return (
        <div className="jobList">
          {tagNodes}
        </div>
    );
  }
});

var StatusContainer = React.createClass({
  getStatus: function(appState){
    if(appState == AppState.Fetching)
      return "fetching url...";
    else if(appState == AppState.Error)
      return "error fetching url...";
    else
      return "";
  },
  render: function(){
    return (<div className="statusContainer">{this.getStatus(this.props.appState)}</div>);
  }
});

var LoadingIcon = React.createClass({
  render: function(){
    if(this.props.appState == AppState.Parsing)
      return (<div className="bearContainer"><img width="172" height="100" src="/static/images/bear.gif"/> </div>)
    else
      return (<div/>)
  }
});

var HtmlContainer = React.createClass({
  createMarkup: function(html){
    return {__html:html}
  },
  render: function(){
    var html = this.props.html;
    if(html)
      return (<pre><div dangerouslySetInnerHTML={this.createMarkup(html)}/></pre>);
    else
      return (<div/>);
  }
});

var UrlInputForm = React.createClass({
  handleSubmit: function(e) {
    e.preventDefault();
    var url = ReactDOM.findDOMNode(this.refs.url).value.trim();
    if (!url) {
      return;
    }
    this.props.onUrlSubmit({url: url});
  },
  render: function() {
    return (
      <form className="urlForm" onSubmit={this.handleSubmit}>
        <input type="text" defaultValue="massdrop.com"  ref="url" />
        <input type="submit" 
          value="Fetch URL" 
          disabled={ this.props.appState == AppState.Parsing 
                     || this.props.appState == AppState.Fetching} />
      </form>
    );
  }
});

ReactDOM.render(
  <MainComponent pollInterval={5000} />,
  document.getElementById('content')
);
