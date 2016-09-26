
var ee = new EventEmitter();

var message = function(message){
  console.log('Received message: ' + message);
};

ee.addListener('message', message);

var Message = React.createClass({
  render: function () {
    return (
      <div className="message">
        {this.props.content}
      </div>
    )
  }
});

var MessageBox = React.createClass({
  getInitialState: function () {
    return {messages: [], message_num:0}
  },
  componentDidMount: function () {
    ee.addListener('message', this.handleMessage);
  },
  handleMessage: function (message) {
    var messageId = `message-${this.state.message_num}`;
    var newMessage = {content: message, id: messageId};
    this.setState({messages: this.state.messages.concat([newMessage]),
                   message_num: this.state.message_num += 1});
  },
  render: function () {
    var messageNodes = this.state.messages.map(function(message){
      return (
        <Message
          key={message.id}
          content={message.content}>
        </Message>
      )
    });

    return (
      <div className="messageBox">
        {messageNodes}
      </div>
    )
  }
});


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
          <input
            type="text"
            name="urlinput"
            id={this.props.id}
            value={this.state.value}
            onChange={this.handleChange}
            placeholder="Site or Feed address"/>
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
    return { inputs: ['input-0'], urls: [], input_num: 1};
  },
  onButtonDelete: function (index) {
    if (this.state.inputs.length > 1){
      var inputs = this.state.inputs.filter(function(input, i) {
        return index !== i;
      });
      this.setState({ inputs: inputs });
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
    var maxInputs = 3;
    if (this.state.inputs.length < maxInputs) {
      var newInput = `input-${this.state.input_num}`;
      this.setState({ inputs: this.state.inputs.concat([newInput]),
                      input_num: this.state.input_num += 1 });
    };
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
          key={this.state.inputs[i]}
          id={input}
          onDelete={boundClick}
          onHandleChange={boundValue}
        />
      );
    }.bind(this));
    var segmentClass = "ui segment";
    if (this.props.searchLoading) segmentClass += " loading";
    if (this.props.searchLoading) {
      var loading = (
        <div className="ui dimmer active inverted">
          <div className="ui active text loader">
            Searching for Feeds
          </div>
        </div>
      );
    } else {
      var loading = null;
    };
    return (
      <div className="ui segment">
        <h3>Search Sites for RSS Feeds</h3>
        {loading}
        <form className="ui form" onSubmit={this.handleSubmit}>
          {searchNodes}
          <button className="ui button blue" type="submit" value="Post">
            Search for Feeds
          </button>
          <button type="button" className="ui button right floated" onClick={ () => this.appendInput() }>
            Add Field
          </button>
        </form>
      </div>
    );
  }
});

var Result = React.createClass({
  getInitialState: function () {
    return {
      loading: false,
      subscribed: this.props.initialSubscribed
    };
  },
  handleSaveClick: function (e) {
    e.preventDefault();
    this.setState({loading: true});
    var data = JSON.stringify(this.props.url);
    $.ajax({
      url: this.props.saveUrl,
      data: data,
      dataType: 'json',
      type: 'POST',
      contentType: "application/json;charset=utf-8",
      success: function (result) {
        console.log('success: ' + result.subscribed);
        if (result.subscribed === this.props.url){
          ee.emitEvent('message', ['Subscribed to ' + this.props.url]);
          this.setState({loading: false, subscribed: true});
        } else {
          this.setState({loading: false});
        };
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this),
      timeout: 30000
    });
  },
  render: function () {
    if (this.state.subscribed) {
      var subscribeButton = (
        <div className="ui bottom attached button green">
        <i className="checkmark icon"></i>
          Subscribed
        </div>
      );
    } else {
      var subscribeButton = (
        <button className="ui bottom attached button" onClick={this.handleSaveClick}>
          <i className="add icon"></i>
          Subscribe
        </button>
      )
    };
    if (this.props.site_icon_link) {
      var image = (
        <img className="left floated mini ui image" src={this.props.site_icon_link}></img>
      );
    } else {
      var image = null;
    };
    if (this.state.loading){
      var loading = (
        <div className="ui dimmer active inverted">
          <div className="ui active text loader">
            Subscribing
          </div>
        </div>
      );
    } else {
      var loading = null;
    };
    return (
      <div className="ui centered card">
        <div className="content">
          {loading}
          {image}
          <div className="header">{this.props.title}</div>
          <div className="meta">
            <a href={this.props.url}>{this.props.url}</a>
          </div>
          <div className="description">
            {this.props.description}
          </div>
        </div>
        {subscribeButton}
      </div>
    );
  }
});

var SearchResults = React.createClass({
  render: function () {
    var saveUrl = this.props.saveUrl;
    var resultNodes = this.props.data.map(function (feed, i) {
      console.log(feed);
      return (
        <Result
          key={i}
          url={feed.url}
          title={feed.title}
          description={feed.description}
          initialSubscribed={feed.subscribed}
          site_icon_link={feed.site_icon_link}
          saveUrl={saveUrl}>
        </Result>
      );
    });
    return (
      <div className="ui two cards stackable">
        {resultNodes}
      </div>
    );
  }
});

var FeedSearch = React.createClass({
  getInitialState: function () {
    return {data: [], searchLoading: false};
  },
  handleSearchSubmit: function (urls) {
    this.setState({searchLoading: true});
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: 'POST',
      data: urls,
      success: function (data) {
        console.log(data);
        console.log(data.result);
        this.setState({ data: data.result, searchLoading: false });
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this),
      timeout: 30000
    });
  },
  render: function () {
    return (
      <div className="ui container">
        <SearchForm
          onSearchSubmit={this.handleSearchSubmit}
          searchLoading={this.state.searchLoading} />
        <SearchResults
          data={this.state.data}
          saveUrl={this.props.saveUrl} />
      </div>
    );
  }
});

ReactDOM.render(
 <FeedSearch url='/get' saveUrl='/save2'/>,
 document.getElementById('content')
),

ReactDOM.render(
  <MessageBox />,
  document.getElementById('messagearea')
);
