import React from "react";
import styles from "./index.module.css";
import "./index.css";
export default class App extends React.Component {
  clickHandler = () => {
    alert("hello");
  };
  render() {
    return (
      <div onClick={this.clickHandler} className={styles.btn}>
        welcome to ssr world
      </div>
    );
  }
}