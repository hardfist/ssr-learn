import React from "react";
export default class App extends React.Component {
  clickHandler = () => {
    console.log('click');
  };
  render() {
    return <div onClick={this.clickHandler}>welcome to ssr world</div>;
  }
}
