import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Tabs, Tab } from 'stylable-components/dist/src/components/tabs';
import styles from '~/Styles/gallery-settings.scss';
import { WixThemeProvider } from '../../../Common/wix-theme-provider';

class ManageMediaSection extends Component {
  render() {
    return <div>Manage Media</div>;
  }
}

class AdvancedSettingsSection extends Component {
  render() {
    return <div>Advanced Settings</div>;
  }
}
export class GallerySettingsModal extends Component {
  render() {
    const { activeTab } = this.props;
    return (
      <div className={styles['gallery-settings']}>
        <h3>Gallery Settings</h3>
        <WixThemeProvider>
          <Tabs value={activeTab}>
            <Tab label={'Manage Media'} value={'manage_media'}>
              <ManageMediaSection />
            </Tab>
            <Tab label={'Advanced'} value={'advanced_settings'}>
              <AdvancedSettingsSection />
            </Tab>
          </Tabs>
        </WixThemeProvider>
      </div>
    );
  }
}

GallerySettingsModal.propTypes = {
  activeTab: PropTypes.oneOf(['manage_media', 'advanced_settings']),
};

export default GallerySettingsModal;