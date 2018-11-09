import React from 'react';
import { Redirect, Route } from 'react-router-dom';
const RedirectWithStatus = ({ from, to, status, exact }) => (
  <Route
    render={({ staticContext }) => {
      if (staticContext) {
        staticContext.status = status;
      }
      return <Redirect from={from} to={to} exact={exact} />;
    }}
  />
);

export default RedirectWithStatus;
