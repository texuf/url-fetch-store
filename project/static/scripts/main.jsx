
var AppState = {
  None:0,
  Fetching:1,
  Parsing:2,
  Error:3
};


var MainComponent = React.createClass({
  getInitialState: function() {
    return {
      originalHtml: "",
      html: "", 
      tagStats:{}, 
      appState:AppState.None,
    };
  },
  handleUrlSubmit: function(data) {
    this.setState({
      html: "",
      originalHtml:"",
      tagStats:{},
      appState: AppState.Fetching
    });   
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: 'POST',
      data: data,
      success: function(data) {
        this.setState({
          originalHtml: data.html,
          tagStats:data.tagStats,
          appState:AppState.Parsing,
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
  colorSubstrings: function(self, tagTuples, i, startIndex, new_html, highlight){
    if(startIndex >= self.state.originalHtml.length)
    {
      self.setState({
        appState:AppState.None,
        html:new_html
      });
      //Recursive End condition
      return;
    }
    
    self.setState({
      appState:AppState.Parsing,
      html:new_html
    });
  
    var endIndex = (i == tagTuples.length)
                    ? self.state.originalHtml.length
                    : (highlight)
                      ? tagTuples[i][1]
                      : tagTuples[i][0],
       substring = self.state.originalHtml.substring(startIndex, endIndex);
    Rainbow.color(substring, 'html', function(highlighted_code) {
        if(highlight)
        {
          new_html += '<span class="highlight">'+highlighted_code+'</span>';
          i=i+1;
        }
        else
        {
          new_html += highlighted_code
        }
        self.colorSubstrings(self, tagTuples, i, endIndex, new_html, !highlight);
    });
  },
  handleTagClick: function(tag){
    this.colorSubstrings(this, this.state.tagStats[tag], 0, 0, "", false);
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
            <TagsContainer  
              tagStats={this.state.tagStats}  
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

var TagsContainer = React.createClass({
  render:function(){
    var self=this;
    var tagNodes = Object.keys(this.props.tagStats).map(function(key, index){
      return (
          <div key={key} className="tagName">
            <button 
              className="tagButton" 
              onClick={self.props.onTagClick.bind(self.props.parent, key)}
              disabled={self.props.appState == AppState.Parsing}>
              {key} ({self.props.tagStats[key].length}) 
            </button>
          </div>
        )
    });
    return (
        <div className="tagList">
          {tagNodes}
        </div>
    );
  }
});

var StatusContainer = React.createClass({
  getStatus: function(appState){
    if(appState == AppState.Parsing)
      return "parsing markup...";
    else if(appState == AppState.Fetching)
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
        <input type="text" defaultValue="slack.com"  ref="url" />
        <input type="submit" 
          value="Fetch URL" 
          disabled={ this.props.appState == AppState.Parsing 
                     || this.props.appState == AppState.Fetching} />
      </form>
    );
  }
});

ReactDOM.render(
  <MainComponent url="/api/fetch" pollInterval={2000} />,
  document.getElementById('content')
);
