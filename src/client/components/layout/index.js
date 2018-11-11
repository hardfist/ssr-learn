import React from 'react';
export default class Layout extends React.Component {
  render() {
    return (
      <div id="wrapper">
        <div id="header">
          <a id="yc" href="http://www.ycombinator.com">
            <img src="https://news.ycombinator.com/y18.gif" />
          </a>
          <h1>
            <a href="/news">{'hackernews'}</a>
          </h1>
        </div>
        {this.props.children}
      </div>
    );
  }
}
