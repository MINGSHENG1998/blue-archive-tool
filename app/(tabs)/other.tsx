import { StyleSheet, Image, Platform, Linking } from "react-native";
import { useCallback } from "react";
import { List, Divider, Surface, IconButton, Button } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Collapsible } from "@/components/Collapsible";
import { ExternalLink } from "@/components/ExternalLink";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";

export default function OtherScreen() {
  const insets = useSafeAreaInsets();

  const handleFeedback = useCallback(() => {
    Linking.openURL("mailto:chillandcodestudio@gmail.com?subject=App (Blue Archive Tool) Feedback");
  }, []);

  return (
    <ParallaxScrollView noheader={true}>
      <Surface
        style={[styles.container, { paddingTop: insets.top }]}
        elevation={0}
      >
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Settings & More</ThemedText>
        </ThemedView>
        {/* App Settings Section */}
        <List.Section>
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

        <Divider style={styles.divider} />

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
        <List.Section>
          <List.Subheader>About</List.Subheader>
          <List.Item
            title="Version"
            description="1.0.0"
            left={(props) => <List.Icon {...props} icon="information" />}
          />
          {/* <List.Item
            title="Terms of Service"
            left={(props) => <List.Icon {...props} icon="file-document" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <List.Item
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
});
