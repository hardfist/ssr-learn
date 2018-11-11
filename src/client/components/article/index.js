import * as Util from 'lib/util';
import * as React from 'react';
import { Link } from 'react-router-dom';
export default class Article extends React.Component {
  static defaultProps = {
    index: 0
  };
  render() {
    const { item, index } = this.props;
    return (
      <div className="item" key={index}>
        <span className="index">{index}.</span>
        <p>
          <a className="title" target="_blank" href={item.url}>
            {item.title}
          </a>
          <span className="domain">({Util.domain(item.url)})</span>
        </p>
        <p className="subtext">
          <span>
            {item.score} points by{' '}
            <Link to={`/news/user/${item.by}`}>{item.by}</Link>
          </span>
          {Util.relativeTime(item.time)}
          <span className="comments-link">
            |{' '}
            <Link to={`/news/item/${item.id}`}>
              {item.descendants} comments
            </Link>
          </span>
        </p>
      </div>
    );
  }
}
