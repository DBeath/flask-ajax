
var SearchNode = React.createClass({
  getInitialState: function() {
    return {value: ""};
  },
  handleChange: function (e) {
    this.setState({value: e.target.value});
    this.props.onHandleChange(e.target.value);
  },
  handleDeleteButton: function (e) {
    e.preventDefault();
    this.setState({value: ""});
    this.props.onDelete();
  },
  render: function () {
    return (
      <div className="field">
        <div className="ui action input">
          <input type="text" name="urlinput" id={this.props.id} value={this.state.value} onChange={this.handleChange}/>
          <button type="button" className="ui icon button delete" onClick={this.handleDeleteButton}>
            <i className="remove icon"></i>
          </button>
        </div>
      </div>
    );
  }
});

var SearchForm = React.createClass({
  getInitialState: function () {
    return { inputs: ['input-0'], urls: []};
  },
  onButtonDelete: function (index) {
    if (this.state.inputs.length > 1){
      var inputs = this.state.inputs.filter(function(input, i) {
        return index !== i;
      });
      this.setState({ inputs: inputs});
    }
    var urls = this.state.urls;
    urls.splice(index, 1);
    this.state.urls = urls;
  },
  onHandleChange: function (index, value) {
    var urls = this.state.urls;
    urls[index] = value;
    this.state.urls = urls;
  },
  appendInput: function () {
    var newInput = `input-${this.state.inputs.length}`;
    this.setState({ inputs: this.state.inputs.concat([newInput]) });
  },
  handleSubmit: function (e) {
    e.preventDefault();
    this.props.onSearchSubmit({ urls: this.state.urls });
    return;
  },
  render: function () {
    var searchNodes = this.state.inputs.map(function(input, i){
      var boundClick = this.onButtonDelete.bind(this, i);
      var boundValue = this.onHandleChange.bind(this, i);
      return (
        <SearchNode
          key={i}
          id={input}
          onDelete={boundClick}
          onHandleChange={boundValue}
        />
      );
    }.bind(this));
    return (
      <div className="ui segment">
        <form className="ui form" onSubmit={this.handleSubmit}>
          {searchNodes}
          <button type="button" className="ui button" onClick={ () => this.appendInput() }>
            Add Field
          </button>
          <button className="ui button blue" type="submit" value="Post">Submit</button>
        </form>
      </div>
    );
  }
});

var Result = React.createClass({
  render: function () {
    return (
      <div className="item">
        <div className="ui checkbox">
          <input type="checkbox" className="feedinput"/>
          <label>{this.props.url}</label>
        </div>
      </div>
    );
  }
});

var SearchResults = React.createClass({
  render: function () {
    console.log(this.props);
    var resultNodes = this.props.data.map(function (feed, i) {
      console.log(feed);
      return (
        <Result
          key={i}
          url={feed.url}
          description={feed.description}>
        </Result>
      );
    });
    return (
      <div className="feedsresult">
        {resultNodes}
      </div>
    );
  }
});

var FeedSearch = React.createClass({
  getInitialState: function () {
    return {data: []};
  },
  handleSearchSubmit: function (urls) {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: 'POST',
      data: urls,
      success: function (data) {
        console.log(data);
        console.log(data.result);
        this.setState({ data: data.result });
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  render: function () {
    return (
      <div className="ui container">
        <SearchForm onSearchSubmit={this.handleSearchSubmit} />
        <SearchResults data={this.state.data} />
      </div>
    );
  }
});

ReactDOM.render(
 <FeedSearch url='/get'/>,
 document.getElementById('content')
)
