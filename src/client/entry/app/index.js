import React from "react";
import './index.css';
export default class App extends React.Component {
  clickHandler = () => {
    alert('hello');
  };
  render() {
    return <div onClick={this.clickHandler}>welcome to ssr world</div>;
  }
}
