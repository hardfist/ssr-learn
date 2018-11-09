import React, { Component } from 'react';
import Status from 'components/status';
class NotFound extends Component {
  render() {
    return (
      <Status code={404}>
        <div>
          <h1>Sorry, can’t find that.</h1>
        </div>
      </Status>
    );
  }
}

export default NotFound;
