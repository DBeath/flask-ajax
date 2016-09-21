
var SearchNode = React.createClass({
  getInitialState: function() {
    return {value: ""};
  },
  render: function () {
    return (
      <div className="field">
        <div className="ui action input">
          <p>{this.props.input}</p>
          <input type="text" name="urlinput" id={this.props.input} value={this.state.value}/>
          <button type="button" className="ui icon button delete" onClick={() => this.props.onDelete(this.props.input)}>
            <i className="remove icon"></i>
          </button>
        </div>
      </div>
    );
  }
});

var RemoveSearchNodeButton = React.createClass({
  render: function() {
    return (
      <button type="button" className="ui icon button" onClick={this.props.clickHandler}>
        <i className="remove icon"></i>
      </button>
    )
  }
});

var FindForm = React.createClass({
  getInitialState: function () {
    return { inputs: ['input-0'] };
  },
  onDelete: function (input) {
    var index = this.state.inputs.findIndex(input);
    this.setState({ inputs: this.state.inputs.splice(index, 1) });
  },
  appendInput() {
    var newInput = `input-${this.state.inputs.length}`;
    this.setState({ inputs: this.state.inputs.concat([newInput]) });
  },
  render: function () {
    var searchNodes = this.state.inputs.map(function(input){
      return (
        <SearchNode
          key={input}
          id={input}
          onDelete={input => this.onDelete(input)}
        />
      );
    });
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
 <FindForm url='/get' />,
 document.getElementById('content')
)
