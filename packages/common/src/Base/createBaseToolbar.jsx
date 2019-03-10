/* eslint-disable react/no-find-dom-node */
import React, { PureComponent } from 'react';
import * as PropTypes from 'prop-types';
import classNames from 'classnames';
import pickBy from 'lodash/pickBy';
import Measure from 'react-measure';
import { TOOLBARS, DISPLAY_MODE } from '../consts';
import { getConfigByFormFactor } from '../Utils/getConfigByFormFactor';
import { mergeToolbarSettings } from '../Utils/mergeToolbarSettings';

import Separator from '../Components/Separator';
import BaseToolbarButton from './baseToolbarButton';
import { getDefaultToolbarSettings } from './default-toolbar-settings';
import { BUTTONS, BUTTONS_BY_KEY, BlockLinkButton, DeleteButton } from './buttons';
import Panel from '../Components/Panel';
import toolbarStyles from '../../statics/styles/plugin-toolbar.scss';
import buttonStyles from '../../statics/styles/plugin-toolbar-button.scss';
import createWithPubsub from '../Utils/pubsubHoc';

const toolbarOffset = 12;

const getInitialState = () => ({
  // position: { transform: 'translate(-50%) scale(0)' },
  showLeftArrow: false,
  showRightArrow: false,
  overrideContent: undefined,
  tabIndex: -1,
});

export default function createToolbar({
  buttons,
  theme,
  pubsub,
  helpers,
  isMobile,
  anchorTarget,
  relValue,
  t,
  name,
  uiSettings,
  getToolbarSettings = () => [],
}) {
  class BaseToolbar extends PureComponent {
    constructor(props) {
      super(props);

      const { all, hidden } = buttons;
      const visibleButtons = all.filter(({ keyName }) => !hidden.includes(keyName));

      const defaultSettings = getDefaultToolbarSettings({ pluginButtons: visibleButtons });
      const customSettings = getToolbarSettings({ pluginButtons: visibleButtons }).filter(
        ({ name }) => name === TOOLBARS.PLUGIN
      );
      const toolbarSettings = mergeToolbarSettings({ defaultSettings, customSettings }).filter(
        ({ name }) => name === TOOLBARS.PLUGIN
      )[0];

      const {
        shouldCreate,
        getPositionOffset,
        getButtons,
        getVisibilityFn,
        getDisplayOptions,
        getToolbarDecorationFn,
      } = toolbarSettings;

      this.structure = getConfigByFormFactor({ config: getButtons(), isMobile, defaultValue: [] });
      this.offset = getConfigByFormFactor({
        config: getPositionOffset(),
        isMobile,
        defaultValue: { x: 0, y: 0 },
      });
      this.shouldCreate = getConfigByFormFactor({
        config: shouldCreate(),
        isMobile,
        defaultValue: true,
      });
      this.visibilityFn = getConfigByFormFactor({
        config: getVisibilityFn(),
        isMobile,
        defaultValue: () => true,
      });
      this.displayOptions = getConfigByFormFactor({
        config: getDisplayOptions(),
        isMobile,
        defaultValue: { displayMode: DISPLAY_MODE.NORMAL },
      });
      const toolbarDecorationFn = getConfigByFormFactor({
        config: getToolbarDecorationFn(),
        isMobile,
        defaultValue: () => null,
      });
      this.ToolbarDecoration = toolbarDecorationFn();

      this.state = getInitialState();
    }

    componentWillReceiveProps(nextProps) {
      if (nextProps.componentLink !== this.props.componentLink) {
        this.onComponentLinkChange(nextProps.componentLink);
      }
      // Object.keys(nextProps)
      //   .filter(key => {
      //     return nextProps[key] !== this.props[key];
      //   })
      //   .forEach(key => {
      //     console.log('changed property:', key, 'from', this.props[key], 'to', nextProps[key]);
      //   });
    }

    onOverrideContent = overrideContent => {
      this.setState({ overrideContent });
    };

    onComponentLinkChange = linkData => {
      const { url, targetBlank, nofollow } = linkData || {};
      const link = url
        ? {
            url,
            target: targetBlank ? '_blank' : anchorTarget || '_self',
            rel: nofollow ? 'nofollow' : relValue || 'noopener',
          }
        : null;

      pubsub.update('componentData', { config: { link } });
    };

    setLayoutProps = ({
      alignment: componentAlignment,
      size: componentSize,
      textWrap: componentTextWrap,
    }) => {
      pubsub.set(pickBy({ componentAlignment, componentSize, componentTextWrap }));
    };

    isVisible() {
      return this.visibilityFn();
    }

    getRelativePositionStyle() {
      if (!this.toolbarRef) {
        return {};
      }
      const toolbarHeight = this.toolbarRef.offsetHeight;
      const {
        left: offsetParentLeft,
        top: offsetParentTop,
      } = this.toolbarRef.offsetParent.getBoundingClientRect();
      const { x, y } = this.offset;
      const boundingRect = this.props.boundingRect;
      this.top = this.top || boundingRect.top - toolbarHeight - toolbarOffset - offsetParentTop + y; //prevents recalculating top of linkPanel. (not the best solution)
      return {
        top: this.top,
        left: boundingRect.left + boundingRect.width / 2 - offsetParentLeft + x,
        transform: 'translate(-50%) scale(1)',
        transition: 'transform 0.15s cubic-bezier(.3,1.2,.2,1)',
      };
    }

    calcPosition = () => {
      let position;
      if (this.displayOptions.displayMode === DISPLAY_MODE.NORMAL) {
        position = this.getRelativePositionStyle();
      } else if (this.displayOptions.displayMode === DISPLAY_MODE.FLOATING) {
        position = {
          top: this.offset.y,
          left: this.offset.x,
          transform: 'translate(-50%) scale(1)',
          position: 'absolute',
        };
      } else {
        position = { transform: 'translate(-50%) scale(0)' };
      }
      return position;

      // const componentData = pubsub.get('componentData') || {};
      // const componentState = pubsub.get('componentState') || {};
      // this.setState({
      //   position,
      //   // componentData,
      //   // componentState,
      //   tabIndex: 0, todo shaul: make sure to fix tabIndex
      // });
    };

    scrollToolbar(event, leftDirection) {
      event.preventDefault();
      const { clientWidth, scrollWidth } = this.scrollContainer;
      this.scrollContainer.scrollLeft = leftDirection
        ? 0
        : Math.min(this.scrollContainer.scrollLeft + clientWidth, scrollWidth);
    }

    renderButton = (button, key, themedStyle, separatorClassNames, tabIndex) => {
      const { alignment } = this.state;
      const size = this.props.componentSize;
      const Button = BUTTONS_BY_KEY[button.type] || BaseToolbarButton;
      const buttonProps = {
        ...this.mapComponentDataToButtonProps(button, this.props.componentData),
        ...this.mapStoreDataToButtonProps(button, pubsub.store, this.props.componentData),
      };

      switch (button.type) {
        case BUTTONS.ALIGNMENT_LEFT:
        case BUTTONS.ALIGNMENT_CENTER:
        case BUTTONS.ALIGNMENT_RIGHT:
          return (
            <Button
              alignment={alignment}
              setLayoutProps={this.props.onLayoutChange}
              theme={themedStyle}
              isMobile={isMobile}
              key={key}
              t={t}
              tabIndex={tabIndex}
              {...buttonProps}
            />
          );
        case BUTTONS.SIZE_SMALL:
        case BUTTONS.SIZE_MEDIUM:
        case BUTTONS.SIZE_LARGE:
          return (
            <Button
              size={size}
              setLayoutProps={this.props.onLayoutChange}
              theme={themedStyle}
              isMobile={isMobile}
              key={key}
              t={t}
              tabIndex={tabIndex}
              {...buttonProps}
            />
          );
        case BUTTONS.SIZE_ORIGINAL:
        case BUTTONS.SIZE_CONTENT:
        case BUTTONS.SIZE_FULL_WIDTH:
        case BUTTONS.SIZE_SMALL_LEFT:
        case BUTTONS.SIZE_SMALL_CENTER:
        case BUTTONS.SIZE_SMALL_RIGHT:
          return (
            <Button
              size={size}
              alignment={alignment}
              setLayoutProps={this.props.onLayoutChange}
              theme={themedStyle}
              key={key}
              t={t}
              tabIndex={tabIndex}
              {...buttonProps}
            />
          );
        case BUTTONS.SEPARATOR:
          return <Separator className={separatorClassNames} key={key} />;
        case BUTTONS.HORIZONTAL_SEPARATOR:
          return <Separator className={separatorClassNames} horizontal key={key} />;
        case BUTTONS.LINK:
          return (
            <BlockLinkButton
              tabIndex={tabIndex}
              pubsub={pubsub}
              onOverrideContent={this.onOverrideContent}
              theme={themedStyle}
              key={key}
              helpers={helpers}
              isMobile={isMobile}
              componentState={this.state.componentState}
              closeModal={helpers.closeModal}
              anchorTarget={anchorTarget}
              relValue={relValue}
              t={t}
              uiSettings={uiSettings}
            />
          );
        case BUTTONS.DELETE:
          return (
            <DeleteButton
              tabIndex={tabIndex}
              onClick={pubsub.get('deleteBlock')}
              theme={themedStyle}
              key={key}
              t={t}
              {...buttonProps}
            />
          );
        default:
          return (
            <Button
              tabIndex={tabIndex}
              theme={themedStyle}
              componentData={this.props.componentData}
              componentState={this.props.componentState}
              pubsub={pubsub}
              helpers={helpers}
              key={key}
              t={t}
              isMobile={isMobile}
              displayPanel={this.displayPanel}
              displayInlinePanel={this.displayInlinePanel}
              hideInlinePanel={this.hidePanels}
              {...buttonProps}
              uiSettings={uiSettings}
            />
          );
      }
    };

    mapComponentDataToButtonProps = (button, componentData) => {
      if (!button.mapComponentDataToButtonProps) {
        return button;
      }
      return {
        ...button,
        ...button.mapComponentDataToButtonProps(componentData),
      };
    };

    mapStoreDataToButtonProps = (button, store, componentData) => {
      if (!button.mapStoreDataToButtonProps) {
        return button;
      }
      return {
        ...button,
        ...button.mapStoreDataToButtonProps({ store, componentData }),
      };
    };

    setToolbarScrollButton = (scrollLeft, scrollWidth, clientWidth) => {
      const currentScrollButtonWidth =
        this.state.showLeftArrow || this.state.showRightArrow ? 20 : 0;
      const isScroll = scrollWidth - clientWidth - currentScrollButtonWidth > 8;

      this.setState({
        showLeftArrow: isScroll && scrollLeft === scrollWidth - clientWidth,
        showRightArrow: isScroll && scrollLeft < scrollWidth - clientWidth,
      });
    };

    hidePanels = () => this.setState({ panel: null, inlinePanel: null });

    displayPanel = panel => {
      this.hidePanels();
      this.setState({ panel });
    };

    displayInlinePanel = inlinePanel => {
      this.hidePanels();
      this.setState({ inlinePanel });
    };

    renderInlinePanel() {
      const { inlinePanel } = this.state;
      const { componentData, componentState } = this.props;
      const { PanelContent, keyName } = inlinePanel || {};

      return inlinePanel ? (
        <div
          className={toolbarStyles.pluginToolbar_inlinePanel}
          data-hook="baseToolbar_InlinePanel"
        >
          <PanelContent
            key={keyName}
            theme={theme}
            store={pubsub}
            helpers={helpers}
            t={t}
            componentData={componentData}
            componentState={componentState}
            close={this.hidePanels}
          />
        </div>
      ) : null;
    }

    renderPanel() {
      const { panel } = this.state;
      const { componentData, componentState } = this.props;

      return panel ? (
        <div className={toolbarStyles.pluginToolbar_panel}>
          <Panel
            key={panel.keyName}
            theme={theme}
            store={pubsub}
            helpers={helpers}
            t={t}
            componentData={componentData}
            componentState={componentState}
            content={panel.PanelContent}
            keyName={panel.keyName}
            close={this.hidePanels}
          />
        </div>
      ) : null;
    }

    renderToolbarContent() {
      const {
        showLeftArrow,
        showRightArrow,
        overrideContent: OverrideContent,
        tabIndex,
      } = this.state;
      const hasArrow = showLeftArrow || showRightArrow;
      const { toolbarStyles: toolbarTheme } = theme || {};
      const { buttonStyles: buttonTheme, separatorStyles: separatorTheme } = theme || {};
      const scrollableContainerClasses = classNames(
        toolbarStyles.pluginToolbar_scrollableContainer,
        toolbarTheme && toolbarTheme.pluginToolbar_scrollableContainer
      );
      const buttonContainerClassnames = classNames(
        toolbarStyles.pluginToolbar_buttons,
        toolbarTheme && toolbarTheme.pluginToolbar_buttons,
        {
          [toolbarStyles.pluginToolbar_overrideContent]: !!OverrideContent,
          [toolbarTheme.pluginToolbar_overrideContent]: !!OverrideContent,
        }
      );
      const themedButtonStyle = {
        buttonWrapper: classNames(
          buttonStyles.pluginToolbarButton_wrapper,
          buttonTheme && buttonTheme.pluginToolbarButton_wrapper
        ),
        button: classNames(
          buttonStyles.pluginToolbarButton,
          buttonTheme && buttonTheme.pluginToolbarButton
        ),
        icon: classNames(
          buttonStyles.pluginToolbarButton_icon,
          buttonTheme && buttonTheme.pluginToolbarButton_icon
        ),
        active: classNames(
          buttonStyles.pluginToolbarButton_active,
          buttonTheme && buttonTheme.pluginToolbarButton_active
        ),
        disabled: classNames(
          buttonStyles.pluginToolbarButton_disabled,
          buttonTheme && buttonTheme.pluginToolbarButton_disabled
        ),
        ...theme,
      };

      const arrowClassNames = classNames(
        toolbarStyles.pluginToolbar_responsiveArrow,
        toolbarTheme && toolbarTheme.pluginToolbar_responsiveArrow
      );
      const leftArrowIconClassNames = classNames(
        toolbarStyles.pluginToolbar_responsiveArrowLeft_icon,
        toolbarTheme && toolbarTheme.responsiveArrowLeft_icon
      );
      const rightArrowIconClassNames = classNames(
        toolbarStyles.pluginToolbar_responsiveArrowRight_icon,
        toolbarTheme && toolbarTheme.responsiveArrowRight_icon
      );
      const separatorClassNames = classNames(
        toolbarStyles.pluginToolbarSeparator,
        separatorTheme && separatorTheme.pluginToolbarSeparator
      );
      const overrideProps = { onOverrideContent: this.onOverrideContent };

      const dataOffsetKey = this.props.blockKey + '-0-0'; //is used selection mechanism in draft.

      return (
        <div className={buttonContainerClassnames} data-offset-key={dataOffsetKey}>
          <Measure
            client
            scroll
            innerRef={ref => (this.scrollContainer = ref)}
            onResize={({ scroll, client }) =>
              this.setToolbarScrollButton(scroll.left, scroll.width, client.width)
            }
          >
            {({ measure, measureRef }) => (
              <div
                className={scrollableContainerClasses}
                ref={measureRef}
                onScroll={() => measure()}
              >
                {OverrideContent ? (
                  <OverrideContent {...overrideProps} />
                ) : (
                  this.structure.map((button, index) =>
                    this.renderButton(
                      button,
                      index,
                      themedButtonStyle,
                      separatorClassNames,
                      tabIndex
                    )
                  )
                )}
              </div>
            )}
          </Measure>
          {hasArrow && (
            <button
              tabIndex={tabIndex}
              className={arrowClassNames}
              data-hook="pluginToolbarRightArrow"
              onMouseDown={e => this.scrollToolbar(e, showLeftArrow)}
            >
              <i className={showLeftArrow ? leftArrowIconClassNames : rightArrowIconClassNames} />
            </button>
          )}
        </div>
      );
    }

    render() {
      if (!this.shouldCreate) {
        return null;
      }

      const { toolbarStyles: toolbarTheme } = theme || {};

      // TODO: visibilityFn params?
      if (this.isVisible()) {
        const props = {
          style: this.calcPosition(),
          className: classNames(
            toolbarStyles.pluginToolbar,
            toolbarTheme && toolbarTheme.pluginToolbar
          ),
          'data-hook': name ? `${name}PluginToolbar` : null,
          onKeyDown: e => {
            // console.log(e.type);
            e.stopPropagation();
            // e.preventDefault();
          },
          onKeyPress: e => {
            // console.log(e.type);
            e.nativeEvent.stopImmediatePropagation();
            // e.preventDefault();
          },
          onBeforeInput: e => {
            // console.log(e.type);
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
            // e.preventDefault();
          },

          // onFocus: e => {
          //   console.log(e.type);
          //   e.stopPropagation();
          //   e.preventDefault();
          // },
          // onInput: e => {
          //   console.log(e.type);
          //   e.stopPropagation();
          //   e.preventDefault();
          // },
          // onChange: e => {
          //   console.log(e.type);
          //   e.stopPropagation();
          //   e.preventDefault();
          // },
        };

        // const ToolbarDecoration = this.ToolbarDecoration || <div>;
        if (this.ToolbarDecoration) {
          const { ToolbarDecoration } = this;
          return (
            <ToolbarDecoration {...props}>
              {this.renderToolbarContent()}
              {this.renderInlinePanel()}
              {this.renderPanel()}
            </ToolbarDecoration>
          );
        }

        return (
          <div ref={ref => (this.toolbarRef = ref)} {...props}>
            {this.renderToolbarContent()}
            {this.renderInlinePanel()}
            {this.renderPanel()}
          </div>
        );
      } else {
        return null;
      }
    }
  }
  BaseToolbar.propTypes = {
    visibleBlock: PropTypes.string,
    componentState: PropTypes.object,
    componentData: PropTypes.object,
    componentAlignment: PropTypes.string,
    componentSize: PropTypes.string,
    componentTextWrap: PropTypes.bool,
    editorBounds: PropTypes.object,
    boundingRect: PropTypes.object,
    componentLink: PropTypes.object,
    onLayoutChange: PropTypes.func,
    blockKey: PropTypes.string,
  };

  BaseToolbar.defaultProps = {
    componentState: {},
    componentData: {},
  };
  return createWithPubsub(pubsub, [{ key: 'componentLink' }])(BaseToolbar);
}
//
// function withPropsChecker(WrappedComponent) {
//   return class PropsChecker extends Component {
//     componentWillReceiveProps(nextProps) {
//       Object.keys(nextProps)
//         .filter(key => {
//           return nextProps[key] !== this.props[key];
//         })
//         .map(key => {
//           console.log('changed property:', key, 'from', this.props[key], 'to', nextProps[key]);
//         });
//     }
//     render() {
//       return <WrappedComponent {...this.props} />;
//     }
//   };
// }
