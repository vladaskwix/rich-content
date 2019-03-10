import React from 'react';
import isString from 'lodash/isString';

export default function createWithPubsub(pubsub, subscriptionsToProps) {
  return function(WrappedComponent) {
    class WithPubsub extends React.Component {
      static displayName = `WithPubsub(${getDisplayName(WrappedComponent)})`;
      constructor(props) {
        super(props);
        const createChangeToStateHandler = key => val => {
          // setTimeout(() => this.setState({ [key]: val }));
          this.setState({ [key]: val });
        };
        this.blockUnsubscriptions = [];
        subscriptionsToProps.forEach(subscription => {
          if (isString(subscription)) {
            pubsub.subscribe(subscription, createChangeToStateHandler(subscription));
          } else {
            const { key, blockKey } = subscription;
            this.blockUnsubscriptions.push(
              pubsub.subscribeOnBlock({
                key,
                blockKey,
                callback: createChangeToStateHandler(key),
              })
            );
          }
        });
      }

      componentWillUnmount() {
        subscriptionsToProps.forEach(key => isString(key) && pubsub.unsubscribe(key));
        this.blockUnsubscriptions.forEach(unsubscribe => unsubscribe());
      }

      render() {
        return <WrappedComponent {...this.state} {...this.props} />;
      }
    }
    return WithPubsub;
  };
}

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}
