import React from 'react';

export default class Comments extends React.Component {
  render() {
    const { comment } = this.props;
    return (
      <li>
        <div className="comhead">
          <a className="toggle">[-]</a>
          <a href={`/news/user/${comment.by}`}>{comment.by}</a>
          {comment.time}
        </div>
        <div
          className="comment-content"
          dangerouslySetInnerHTML={{ __html: comment.text }}
        />
      </li>
    );
  }
}
