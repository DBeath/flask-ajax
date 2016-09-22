
var SearchNode = React.createClass({
  getInitialState: function() {
    return {value: ""};
  },
  handleChange: function (e) {
    this.setState({value: e.target.value});
    this.props.onHandleChange(e.target.value);
  },
  render: function () {
    return (
      <div className="field">
        <div className="ui action input">
          <input type="text" name="urlinput" id={this.props.id} value={this.state.value} onChange={this.handleChange}/>
          <button type="button" className="ui icon button delete" onClick={this.props.onDelete}>
            <i className="remove icon"></i>
          </button>
        </div>
      </div>
    );
  }
});

var FindForm = React.createClass({
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

  },
  onHandleChange: function (index, value) {
    var urls = this.state.urls
    urls[index] = value;
    this.state.urls = urls
  },
  appendInput: function () {
    var newInput = `input-${this.state.inputs.length}`;
    this.setState({ inputs: this.state.inputs.concat([newInput]) });
  },
  handleSubmit: function (e) {
    e.preventDefault();

    // var data = this.state.inputs.map(function(input){
    //   console.log(input);
    //   return input.value;
    // });

    var data = {urls: this.state.urls};
    console.log('Data: ' + data);
    console.log(data['urls'])
    // var data = this.state.urls;
    // console.log(data);

    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: 'POST',
      data: data,
      success: function (data) {
        console.log(data);
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
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
        <p>FindForm Url: {this.props.url}</p>
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

ReactDOM.render(
 <FindForm url='/test'/>,
 document.getElementById('content')
)
