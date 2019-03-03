import React from 'react';

export default function createWithPubsub(pubsub, ...args) {
  return function(WrappedComponent) {
    class WithPubsub extends React.Component {
      static displayName = `WithPubsub(${getDisplayName(WrappedComponent)})`;
      constructor(props) {
        super(props);
        args.forEach(key =>
          pubsub.subscribe(key, val => {
            this.setState({ [key]: val });
          })
        );
      }

      componentWillUnmount() {
        args.forEach(key => pubsub.unsubscribe(key));
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
