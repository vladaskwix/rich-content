import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Controlled as CodeMirror } from 'react-codemirror2';
import './RichContentRawDataViewer.css';
require('codemirror/mode/javascript/javascript');
let jBeautify = require('js-beautify').js;

class RichContentRawDataViewer extends Component {
  constructor(props) {
    super(props);
    this.state = this.stateFromProps(props);
    this.options = {
      mode: {
        name: 'javascript',
        json: true,
      },
      theme: 'material',
      lineNumbers: true,
      lineWrapping: false,
      autoScroll: true,
      lineWiseCopyCut: true,
      viewportMargin: Infinity,
    };
  }

  componentDidMount() {
    this.rawView && this.rawView.getCodeMirror().refresh();
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.content !== nextProps.content) {
      this.setState(this.stateFromProps(nextProps));
    }
  }

  stateFromProps(props) {
    return { content: this.fixCode(props.content) };
  }

  fixCode(content) {
    return jBeautify(JSON.stringify(content));
  }

  escapeNewLine(text) {
    return text.replace(/[\n\r]/gimu, '\\n');
  }

  escapeHtml(text) {
    return text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\//g, '&#047;');
  }

  onChange(content) {
    if (content && content.jsObject && !content.error) {
      this.props.onChange(this.fixCode(content.jsObject));
    }
  }

  render = () => (
    <CodeMirror
      ref={ref => (this.rewView = ref)}
      value={this.state.content}
      options={this.options}
      onBeforeChange={(editor, data, value) => {
        this.setState({ value });
      }}
      onChange={(editor, data, value) => {}}
    />
  );
}

// see https://github.com/AndrewRedican/react-json-editor-ajrm for details
RichContentRawDataViewer.propTypes = {
  content: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  viewOnly: PropTypes.bool,
  confirmGood: PropTypes.bool,
  height: PropTypes.string,
  width: PropTypes.string,
  onKeyPressUpdate: PropTypes.func,
  waitAfterKeyPress: PropTypes.func,
  theme: PropTypes.string,
  colors: PropTypes.object,
  style: PropTypes.object,
};

export default RichContentRawDataViewer;
