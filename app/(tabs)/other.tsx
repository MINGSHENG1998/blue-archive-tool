import { StyleSheet, Image, Platform, Linking } from "react-native";
import { useCallback, useState } from "react";
import {
  List,
  Divider,
  Surface,
  IconButton,
  Button,
  Modal,
  Portal,
  Text,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import appJson from '../../app.json';
import { Collapsible } from "@/components/Collapsible";
import { ExternalLink } from "@/components/ExternalLink";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import InlineAd from "../ads/InlineAd";

export default function OtherScreen() {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);

  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  const handleFeedback = useCallback(() => {
    Linking.openURL(
      "mailto:chillandcodestudio@gmail.com?subject=App (Blue Archive Tool) Feedback"
    );
  }, []);

  return (
    <ParallaxScrollView noheader={true}>
      <Surface
        style={[styles.container, { paddingTop: insets.top }]}
        elevation={0}
      >
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">About</ThemedText>
        </ThemedView>
        {/* App Settings Section */}
        {/* <List.Section>
          <List.Subheader>App Settings</List.Subheader>
          <List.Item
            title="General Settings"
            description="App preferences and configuration"
            left={(props) => <List.Icon {...props} icon="cog" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <List.Item
            title="Appearance"
            description="Theme and display options"
            left={(props) => <List.Icon {...props} icon="palette" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <List.Item
            title="Notifications"
            description="Manage push notifications"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
        </List.Section>

        <Divider style={styles.divider} /> */}

        {/* Support Section */}
        <List.Section>
          <List.Subheader>Support</List.Subheader>
          <List.Item
            title="Send Feedback"
            description="Help us improve the app"
            left={(props) => (
              <List.Icon {...props} icon="message-text" color="#2196F3" />
            )}
            onPress={handleFeedback}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          {/* <List.Item
            title="Help Center"
            description="FAQs and documentation"
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          /> */}
        </List.Section>

        <Divider style={styles.divider} />

        {/* About Section */}
        <List.Section style={styles.aboutSection}>
          <List.Subheader>About</List.Subheader>
          <List.Item
            title="Version"
            description={appJson.expo.version}
            left={(props) => <List.Icon {...props} icon="information" />}
          />
          <List.Item
            title="Disclaimer"
            description="Tap to view"
            left={(props) => <List.Icon {...props} icon="hand-front-right" />}
            onPress={showModal}
          />

          <Portal>
            <Modal
              visible={visible}
              onDismiss={hideModal}
              contentContainerStyle={{
                backgroundColor: "#404040",
                padding: 20,
                margin: 20,
                borderRadius: 10,
              }}
            >
              <Text style={{ marginBottom: 20, fontWeight: "bold", color: "white" }}>
                Disclaimer
              </Text>
              <Text style={{ marginBottom: 20, color: "white" }}>
                This app is just a fan project. I do not own any assets or
                intellectual property associated with this content.
              </Text>
              <Button onPress={hideModal} textColor="white">Close</Button>
            </Modal>
          </Portal>
          {/* <List.Item
            title="Terms of Service"
            left={(props) => <List.Icon {...props} icon="file-document" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
         {/*  <List.Item
            title="Privacy Policy"
            left={(props) => <List.Icon {...props} icon="shield-check" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          /> */}
        </List.Section>

        {/* <Button
          mode="outlined"
          icon="logout"
          style={styles.logoutButton}
          contentStyle={styles.logoutButtonContent}
        >
          Sign Out
        </Button> */}
        <Divider style={styles.divider} />
        <InlineAd />
      </Surface>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  divider: {
    marginVertical: 8,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginVertical: 24,
    borderColor: "#FF5252",
  },
  logoutButtonContent: {
    paddingVertical: 8,
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
  aboutSection: {
    marginBottom: 8,
  },
});
