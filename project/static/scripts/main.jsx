
var AppState = {
  None:0,
  Fetching:1,
  Error:3
};


var MainComponent = React.createClass({
  getInitialState: function() {
    return {
      html: "", 
      jobs:[], 
      appState:AppState.None,
    };
  },
  handleUrlSubmit: function(data) {
    this.setState({
      html: "",
      jobs:[],
      appState: AppState.Fetching
    });   
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: 'POST',
      data: data,
      success: function(data) {
        this.setState({
          jobs:data.jobs,
          appState:AppState.None,
        });
        var self = this;
        Rainbow.color(data.html, 'html', function(highlighted_code) {
            self.setState({
              html: highlighted_code,
              appState:AppState.None,
            });
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
  colorSubstrings: function(new_html){
    self.setState({
        appState:AppState.None,
        html:new_html
    });
  },
  handleTagClick: function(job){
    this.colorSubstrings(job.html);
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
              onTagClick={this.handleTagClick} 
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
  render:function(){
    var self=this;
    var tagNodes = Object.keys(this.props.jobs).map(function(job, index){
      return (
          <div key={key} className="jobName">
            <button 
              className="jobButton" 
              onClick={self.props.onTagClick.bind(self.props.parent, job)}
              disabled={job.status != 'complete'}>
              {job.url} 
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
    /*if(this.props.appState == AppState.Parsing)
      return (<div className="bearContainer"><img width="172" height="100" src="/static/images/bear.gif"/> </div>)
    else*/
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
        <input type="text" defaultValue="slack.com"  ref="url" />
        <input type="submit" 
          value="Fetch URL 2" 
          disabled={ this.props.appState == AppState.Fetching} />
      </form>
    );
  }
});

ReactDOM.render(
  <MainComponent url="fetch/" pollInterval={2000} />,
  document.getElementById('content')
);
