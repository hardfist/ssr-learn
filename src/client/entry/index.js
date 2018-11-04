import App from "./app";
import ReactDOM from "react-dom";
import React from "react";

const clientRender = () => {
  return ReactDOM.hydrate(<App />, document.getElementById("root"));
};

const serverRender = props => {
  return <App {...props} />;
};

export default (__BROWSER__ ? clientRender() : serverRender);
