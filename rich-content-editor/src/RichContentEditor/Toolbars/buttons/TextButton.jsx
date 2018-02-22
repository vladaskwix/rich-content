import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { mergeStyles } from '~/Utils';
import styles from '~/Styles/inline-toolbar-button.scss';

export default class TextButton extends Component {

  constructor(props) {
    super(props);
    this.styles = mergeStyles({ styles, theme: props.theme });
  }

  static propTypes = {
    icon: PropTypes.func.isRequired,
    onClick: PropTypes.func.isRequired,
    isActive: PropTypes.func,
    theme: PropTypes.object.isRequired,
  };

  isActive = () => {
    const { isActive } = this.props;
    return isActive ? isActive() : false;
  }

  handleClick = event => {
    const { onClick } = this.props;
    onClick && onClick(event);
  }

  preventBubblingUp = event => event.preventDefault();

  render() {
    const { styles } = this;
    const { icon: Icon } = this.props;
    const iconClassNames = classNames(
      styles.icon,
      {
        [styles.active]: this.isActive(),
      }
    );

    return (
      <div className={styles.buttonWrapper} onMouseDown={this.preventBubblingUp}>
        <button className={styles.button} onClick={this.handleClick}>
          <div className={iconClassNames}>
            <Icon />
          </div>
        </button>
      </div>
    );
  }
}