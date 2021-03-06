export const externals = [
  '@wix/draft-js',
  'assert',
  'classnames',
  'draft-js',
  'lodash',
  'prop-types',
  'react',
  'react-dom',
  'wix-rich-content-common',
  'react-i18next',
];

export const excludedExternals = [
  /draft-js-plugins-editor/,
  /draft-js-.*?-plugin/,
  /react-click-outside/,
  '@wix/draft-js/lib/DraftOffsetKey',
  '@wix/draft-js/lib/isSoftNewlineEvent',
  /wix-rich-content-common\/.*?\.scss/,
];

export const globals = {
  '@wix/draft-js': 'Draft',
  classnames: 'classNames',
  'draft-js': 'Draft',
  'draft-js-code': 'CodeUtils',
  lodash: '_',
  'lodash/camelCase': '_.camelCase',
  'lodash/cloneDeep': '_.cloneDeep',
  'lodash/debounce': '_.debounce',
  'lodash.escaperegexp': '_.escaperegexp',
  'lodash/findIndex': '_.findIndex',
  'lodash/findLastIndex': '_.findLastIndex',
  'lodash/flatMap': '_.flatMap',
  'lodash/get': '_.get',
  'lodash/has': '_.has',
  'lodash/identity': '_.identity',
  'lodash/includes': '_.includes',
  'lodash/isEmpty': '_.isEmpty',
  'lodash/isEqual': '_.isEqual',
  'lodash/isFunction': '_.isFunction',
  'lodash/isNil': '_.isNil',
  'lodash/isNumber': '_.isNumber',
  'lodash/isUndefined': '_.isUndefined',
  'lodash.keys': '_.keys',
  'lodash/mapValues': '_.mapValues',
  'lodash/merge': '_.merge',
  'lodash/mergeWith': '_.mergeWith',
  'lodash/omit': '_.omit',
  'lodash/pick': '_.pick',
  'lodash/pickBy': '_.pickBy',
  'lodash/range': '_.range',
  'lodash/reduce': '_._reduce',
  'lodash/trimStart': '_.trimStart',
  'lodash/upperFirst': '_.upperFirst',
  'prop-types': 'PropTypes',
  react: 'React',
  'react-custom-scrollbars': 'ReactCustomScrollbars',
  'react-dom': 'ReactDOM',
  'react-i18next': 'reactI18next',
  'react-infinite-scroller': 'InfiniteScroll',
  'react-md-spinner': 'MDSpinner',
  'react-measure': 'Measure',
  'react-player': 'ReactPlayer',
  'react-sortable-hoc': 'reactSortableHoc',
  'react-tooltip': 'ReactTooltip',
  'wix-rich-content-common': 'WixRichContentCommon',
};

export const excludedGlobals = [
  'draft-js-plugins-editor',
  /draft-js-.*?-plugin/,
  'react-click-outside',
  '@wix/draft-js/lib/DraftOffsetKey',
  '@wix/draft-js/lib/isSoftNewlineEvent',
];
