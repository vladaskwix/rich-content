/* eslint-disable react/no-find-dom-node */
import React from 'react';
import ReactDom from 'react-dom';
import PropTypes from 'prop-types';
import isNil from 'lodash/isNil';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import classNames from 'classnames';
import createHocName from '../Utils/createHocName';
import getDisplayName from '../Utils/getDisplayName';
import { alignmentClassName, sizeClassName, textWrapClassName } from '../Utils/classNameStrategies';
import { normalizeUrl } from '../Utils/urlValidators';
import Styles from '../../statics/styles/global.scss';
import createWithPubsub from '../Utils/pubsubHoc';

const DEFAULTS = {
  alignment: null,
  size: 'content',
  url: undefined,
  textWrap: null,
};

const createBaseComponent = ({
  PluginComponent,
  theme,
  settings,
  pubsub,
  helpers,
  anchorTarget,
  relValue,
  t,
  isMobile,
  Toolbar,
}) => {
  class WrappedComponent extends React.PureComponent {
    static displayName = createHocName('BaseComponent', PluginComponent);

    constructor(props) {
      super(props);
      this.state = { componentState: {}, ...this.stateFromProps(props) };
    }

    componentWillReceiveProps(nextProps) {
      this.setState(this.stateFromProps(nextProps));
    }

    stateFromProps(props) {
      const { getData, readOnly } = props.blockProps;
      const initialStateKey = 'initialState_' + props.block.getKey();
      const initialState = pubsub.get(initialStateKey);
      if (initialState) {
        //reset the initial state
        pubsub.set(initialStateKey, undefined);
      }
      return {
        componentData: getData() || { config: DEFAULTS },
        readOnly: !!readOnly,
        componentState: initialState || {},
      };
    }

    componentDidMount() {
      this.updateComponent();
      pubsub.subscribe('componentData', this.onComponentDataChange);
      pubsub.subscribe('componentState', this.onComponentStateChange);
      const blockKey = this.props.block.getKey();
      this.unsubscribeOnBlock = pubsub.subscribeOnBlock({
        key: 'componentLink',
        blockKey,
        callback: this.onComponentLinkChange,
      });
    }

    componentDidUpdate() {
      this.duringUpdate = true;
      this.updateComponent();
      this.duringUpdate = false;
    }

    componentWillUnmount() {
      pubsub.unsubscribe('componentData', this.onComponentDataChange);
      pubsub.unsubscribe('componentState', this.onComponentStateChange);
      pubsub.set('visibleBlock', null);
      this.unsubscribeOnBlock && this.unsubscribeOnBlock();
    }

    isSelected = () => {
      const { block, visibleBlock } = this.props;
      return visibleBlock === block.getKey();
    };

    onComponentDataChange = componentData => {
      if (this.isMeAndIdle) {
        this.setState({ componentData: componentData || {} }, () => {
          const {
            blockProps: { setData },
          } = this.props;
          setData(componentData);
        });
      }
    };

    onComponentStateChange = componentState => {
      if (this.isMeAndIdle) {
        this.setState({ componentState: componentState || {} });
      }
    };

    onComponentLinkChange = linkData => {
      this.setState({ linkData });
      const { url, targetBlank, nofollow } = linkData || {};
      if (this.isMeAndIdle) {
        const link = url
          ? {
              url,
              target: targetBlank === true ? '_blank' : anchorTarget || '_self',
              rel: nofollow === true ? 'nofollow' : relValue || 'noopener',
            }
          : null;

        this.updateComponentConfig({ link });
      }
    };

    deleteBlock = () => {
      pubsub.set('visibleBlock', null);
      this.props.blockProps.deleteBlock();
    };

    updateComponent() {
      const { block, blockProps } = this.props;
      if ((blockProps.isFocused && blockProps.isCollapsedSelection) || this.state.toolbarFocus) {
        this.updateSelectedComponent();
      } else if (this.props.visibleBlock === block.getKey()) {
        this.updateUnselectedComponent();
      }
    }

    get isMeAndIdle() {
      return this.isSelected() && !this.duringUpdate;
    }

    updateComponentConfig = newConfig => {
      pubsub.update('componentData', { config: newConfig });
    };

    getBoundingClientRectAsObject = element => {
      const { top, right, bottom, left, width, height, x, y } = element.getBoundingClientRect();
      return { top, right, bottom, left, width, height, x, y };
    };

    onToolbarFocus = () => {
      this.setState({ toolbarFocus: true });
    };
    onToolbarBlur = () => {
      this.setState({ toolbarFocus: false });
    };

    updateSelectedComponent() {
      const { block } = this.props;

      const oldVisibleBlock = this.props.visibleBlock;
      const visibleBlock = block.getKey();
      if (oldVisibleBlock !== visibleBlock) {
        const batchUpdates = {};
        const blockNode = this.ref;
        const componentData = this.state.componentData;
        const config = componentData.config || {};
        const boundingRect = this.getBoundingClientRectAsObject(blockNode);
        batchUpdates.boundingRect = boundingRect;
        batchUpdates.componentData = componentData;
        batchUpdates.componentState = {};
        batchUpdates.componentSize = config.size;
        batchUpdates.componentAlignment = config.alignment;
        batchUpdates.componentTextWrap = config.textWrap;
        batchUpdates.deleteBlock = this.deleteBlock;
        batchUpdates.visibleBlock = visibleBlock;
        pubsub.set(batchUpdates);
      } else {
        //maybe just the position has changed
        const blockNode = this.ref;
        const boundingRect = this.getBoundingClientRectAsObject(blockNode);
        if (!isEqual(this.props.boundingRect, boundingRect)) {
          pubsub.set('boundingRect', boundingRect);
        }
      }
    }

    updateUnselectedComponent() {
      const batchUpdates = {};
      batchUpdates.visibleBlock = null;
      batchUpdates.componentData = {};
      batchUpdates.componentState = {};
      batchUpdates.componentSize = null;
      batchUpdates.componentAlignment = null;
      batchUpdates.componentTextWrap = null;
      pubsub.set(batchUpdates);
    }

    onClickOutside = () => {
      this.setState({ focused: false });
    };

    onFocus = () => {
      this.setState({ focused: true });
    };

    render = () => {
      const {
        blockProps,
        className,
        onClick,
        selection,
        editorBounds,
        boundingRect = {},
      } = this.props;
      const { componentData, componentState, readOnly } = this.state;
      const { link, width: currentWidth, height: currentHeight } = componentData.config || {};
      const { width: initialWidth, height: initialHeight } = settings || {};
      const isEditorFocused = selection.getHasFocus();
      const { isFocused } = blockProps;
      const isActive = isFocused && isEditorFocused && !readOnly;
      const toolbarProps = {
        componentData,
        componentState,
        editorBounds,
        boundingRect,
        blockKey: this.props.block.getKey(),
        onFocus: this.onToolbarFocus,
        onBlur: this.onToolbarBlur,
        onLayoutChange: this.updateComponentConfig,
      };

      const ContainerClassNames = classNames(
        {
          [Styles.pluginContainer]: !readOnly,
          [Styles.pluginContainerReadOnly]: readOnly,
          [Styles.pluginContainerMobile]: isMobile,
          [theme.pluginContainer]: !readOnly,
          [theme.pluginContainerReadOnly]: readOnly,
          [theme.pluginContainerMobile]: isMobile,
        },
        isFunction(PluginComponent.WrappedComponent.alignmentClassName)
          ? PluginComponent.WrappedComponent.alignmentClassName(
              this.state.componentData,
              theme,
              Styles,
              isMobile
            )
          : alignmentClassName(this.state.componentData, theme, Styles, isMobile),
        isFunction(PluginComponent.WrappedComponent.sizeClassName)
          ? PluginComponent.WrappedComponent.sizeClassName(
              this.state.componentData,
              theme,
              Styles,
              isMobile
            )
          : sizeClassName(this.state.componentData, theme, Styles, isMobile),
        isFunction(PluginComponent.WrappedComponent.textWrapClassName)
          ? PluginComponent.WrappedComponent.textWrapClassName(
              this.state.componentData,
              theme,
              Styles,
              isMobile
            )
          : textWrapClassName(this.state.componentData, theme, Styles, isMobile),
        className || '',
        {
          [Styles.hasFocus]: isActive,
          [theme.hasFocus]: isActive,
        }
      );

      const overlayClassNames = classNames(Styles.overlay, theme.overlay, {
        [Styles.hidden]: readOnly,
        [theme.hidden]: readOnly,
      });

      const sizeStyles = {
        width: !isNil(currentWidth) ? currentWidth : initialWidth,
        height: !isNil(currentHeight) ? currentHeight : initialHeight,
      };

      const component = (
        <PluginComponent
          {...this.props}
          isMobile={isMobile}
          settings={settings}
          store={pubsub.store}
          theme={theme}
          componentData={this.state.componentData}
          componentState={this.state.componentState}
          helpers={helpers}
          t={t}
          editorBounds={this.state.editorBounds}
        />
      );

      let anchorProps = {};
      if (!isNil(link)) {
        anchorProps = {
          href: normalizeUrl(link.url),
          target: link.target ? link.target : anchorTarget || '_self',
          rel: link.rel ? link.rel : relValue || 'noopener',
        };
      }
      const anchorClass = classNames(Styles.absFull, Styles.anchor, {
        [Styles.isImage]:
          getDisplayName(PluginComponent)
            .toLowerCase()
            .indexOf('image') !== -1,
      });
      /* eslint-disable jsx-a11y/anchor-has-content */
      return (
        <div style={sizeStyles} className={ContainerClassNames}>
          {!isNil(link) ? (
            <div>
              {component}
              <a className={anchorClass} {...anchorProps} />
            </div>
          ) : (
            component
          )}
          {!this.state.readOnly && (
            <div
              ref={ref => (this.ref = ref)}
              role="none"
              data-hook={'componentOverlay'}
              onClick={onClick}
              className={overlayClassNames}
            />
          )}
          {isFocused ? (
            <Modal>
              <Toolbar {...toolbarProps} />
            </Modal>
          ) : null}
        </div>
      );
      /* eslint-enable jsx-a11y/anchor-has-content */
    };
  }

  WrappedComponent.propTypes = {
    block: PropTypes.object.isRequired,
    blockProps: PropTypes.object.isRequired,
    selection: PropTypes.object.isRequired,
    className: PropTypes.string,
    onClick: PropTypes.func,
    visibleBlock: PropTypes.string,
    // componentState: PropTypes.object,
    // componentData: PropTypes.object,
    // componentAlignment: PropTypes.string,
    // componentSize: PropTypes.string,
    // componentTextWrap: PropTypes.bool,
    editorBounds: PropTypes.object,
    boundingRect: PropTypes.object,
    // componentLink: PropTypes.object,
  };

  return createWithPubsub(pubsub, [
    'visibleBlock',
    // 'componentState',
    // 'componentData',
    // 'componentAlignment',
    // 'componentSize',
    // 'componentTextWrap',
    'boundingRect',
    'editorBounds',
  ])(WrappedComponent);
};

// function createWithPubsub(WrappedComponent) {
//   class WithPubsub extends React.Component {
//     static displayName = `WithPubsub(${getDisplayName(WrappedComponent)})`;
//     constructor(props) {
//       super(props);
//       const createChangeToStateHandler = key => val => {
//         setTimeout(() => this.setState({ [key]: val }));
//       };
//
//       subscriptionsToProps.forEach(subscription => {
//         if (isString(subscription)) {
//           pubsub.subscribe(subscription, createChangeToStateHandler(subscription));
//         } else {
//           const { key, blockKey } = subscription;
//           this.blockUnsubscriptions = pubsub.subscribeOnBlock({
//             key,
//             blockKey,
//             callback: createChangeToStateHandler(key),
//           });
//         }
//       });
//     }
//
//     componentWillUnmount() {
//       subscriptionsToProps.forEach(key => pubsub.unsubscribe(key));
//       this.blockUnsubscriptions &&
//       this.blockUnsubscriptions.forEach(unsubscribe => unsubscribe());
//     }
//
//     render() {
//       return <WrappedComponent {...this.state} {...this.props} />;
//     }
//   }
//   return WithPubsub;
// };

class Modal extends React.Component {
  modalRoot = document.getElementsByClassName('editor')[0];
  render() {
    // eslint-disable-next-line react/prop-types
    return ReactDom.createPortal(this.props.children, this.modalRoot);
  }
}

export default createBaseComponent;
