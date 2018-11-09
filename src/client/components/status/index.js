import React, { Component } from 'react';
import { Route } from 'react-router-dom';

class Status extends Component {
  render() {
    return (
      <Route
        render={({ staticContext }) => {
          if (staticContext) {
            staticContext.status = this.props.code;
          }
          return this.props.children;
        }}
      />
    );
  }
}

export default Status;
