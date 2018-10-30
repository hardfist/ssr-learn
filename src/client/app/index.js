import React from "react";
export default class App extends React.Component {
  clickHandler = () => {
    alert('hello');
  };
  render() {
    return <div onClick={this.clickHandler}>welcome to ssr world</div>;
  }
}
