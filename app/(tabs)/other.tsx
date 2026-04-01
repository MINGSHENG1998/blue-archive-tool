import {
  StyleSheet,
  View,
  Linking,
  Animated,
  TouchableWithoutFeedback,
  Modal as RNModal,
  Dimensions,
  ScrollView,
} from "react-native";
import { memo, useRef, useState, useEffect } from "react";
import {
  List,
  Divider,
  Surface,
  Button,
  Text,
  TextInput,
  HelperText,
  RadioButton,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Application from "expo-application";
import Constants from "expo-constants";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import InlineAd from "../ads/InlineAd";
import { useLanguage } from "@/contexts/language-context";
import { i18n, type Locale, type UIStrings } from "@/constants/i18n";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  ko: "한국어",
  ja: "日本語",
};

const FEEDBACK_COOLDOWN_MS = 3 * 60 * 60 * 1000;
const SCREEN_HEIGHT = Dimensions.get("window").height;

// ── Reusable bottom drawer ──────────────────────────────────────────────────
function BottomDrawer({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
        speed: 20,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.drawerOverlay} />
      </TouchableWithoutFeedback>
      <Animated.View
        style={[styles.drawerContainer, { transform: [{ translateY }] }]}
      >
        <View style={styles.drawerHandle} />
        {children}
      </Animated.View>
    </RNModal>
  );
}

// ── Language drawer ─────────────────────────────────────────────────────────
function LanguageDrawer({
  visible,
  onClose,
  t,
}: {
  visible: boolean;
  onClose: () => void;
  t: UIStrings;
}) {
  const { locale, setLocale } = useLanguage();

  return (
    <BottomDrawer visible={visible} onClose={onClose}>
      <Text style={styles.drawerTitle}>{t.language}</Text>
      <RadioButton.Group
        value={locale}
        onValueChange={(v) => {
          setLocale(v as Locale);
          onClose();
        }}
      >
        {(Object.entries(LOCALE_LABELS) as [Locale, string][]).map(
          ([code, label]) => (
            <RadioButton.Item
              key={code}
              label={label}
              value={code}
              color="#128AFA"
              labelStyle={styles.drawerItemLabel}
              style={styles.drawerItem}
            />
          )
        )}
      </RadioButton.Group>
    </BottomDrawer>
  );
}

// ── Feedback drawer ─────────────────────────────────────────────────────────
const FeedbackDrawer = memo(function FeedbackDrawer({
  visible,
  onClose,
  t,
  lastSent,
  onSent,
}: {
  visible: boolean;
  onClose: () => void;
  t: UIStrings;
  lastSent: number | null;
  onSent: () => void;
}) {
  const titleRef = useRef("");
  const descRef = useRef("");
  const [titleError, setTitleError] = useState("");
  const [descError, setDescError] = useState("");
  const [sending, setSending] = useState(false);

  const validateAndSend = async () => {
    const title = titleRef.current.trim();
    const desc = descRef.current.trim();
    let valid = true;

    if (!title) {
      setTitleError(t.miscTitleError);
      valid = false;
    } else {
      setTitleError("");
    }

    if (!desc) {
      setDescError(t.miscTitleError.replace("Title", "Description"));
      valid = false;
    } else {
      setDescError("");
    }

    if (!valid) return;

    if (lastSent && Date.now() - lastSent < FEEDBACK_COOLDOWN_MS) {
      const hoursLeft = Math.ceil(
        (FEEDBACK_COOLDOWN_MS - (Date.now() - lastSent)) / (1000 * 60 * 60)
      );
      setTitleError(t.miscFeedbackWait.replace("{hours}", String(hoursLeft)));
      return;
    }

    setSending(true);
    try {
      const subject = encodeURIComponent(
        `[Blue Archive Tool Feedback] ${title}`
      );
      const body = encodeURIComponent(desc);
      await Linking.openURL(
        `mailto:chillandcodestudio@gmail.com?subject=${subject}&body=${body}`
      );
      onSent();
    } catch {
      setDescError(t.miscFeedbackFailed);
    } finally {
      setSending(false);
    }
  };

  return (
    <BottomDrawer visible={visible} onClose={onClose}>
      <Text style={styles.drawerTitle}>{t.miscFeedbackModalTitle}</Text>

      <TextInput
        label={t.miscTitleLabel}
        defaultValue=""
        onChangeText={(v) => {
          titleRef.current = v;
          if (v.trim() && titleError) setTitleError("");
        }}
        mode="outlined"
        style={styles.input}
        outlineColor="rgba(18, 138, 250, 0.3)"
        activeOutlineColor="#128AFA"
        textColor="white"
        theme={{ colors: { onSurfaceVariant: "#aaa" } }}
        error={!!titleError}
      />
      {!!titleError && (
        <HelperText type="error" visible>
          {titleError}
        </HelperText>
      )}

      <TextInput
        label={t.miscDescLabel}
        defaultValue=""
        onChangeText={(v) => {
          descRef.current = v;
          if (v.trim() && descError) setDescError("");
        }}
        mode="outlined"
        multiline
        numberOfLines={4}
        style={[styles.input, styles.descInput]}
        outlineColor="rgba(18, 138, 250, 0.3)"
        activeOutlineColor="#128AFA"
        textColor="white"
        theme={{ colors: { onSurfaceVariant: "#aaa" } }}
        error={!!descError}
      />
      {!!descError && (
        <HelperText type="error" visible>
          {descError}
        </HelperText>
      )}

      <View style={styles.drawerButtons}>
        <Button onPress={onClose} textColor="#aaa" disabled={sending}>
          {t.miscCancel}
        </Button>
        <Button
          mode="contained"
          onPress={validateAndSend}
          loading={sending}
          disabled={sending}
          buttonColor="#128AFA"
          textColor="#FFFFFF"
        >
          {t.miscSubmit}
        </Button>
      </View>
    </BottomDrawer>
  );
});

// ── Disclaimer drawer ────────────────────────────────────────────────────────
function DisclaimerDrawer({
  visible,
  onClose,
  t,
}: {
  visible: boolean;
  onClose: () => void;
  t: UIStrings;
}) {
  return (
    <BottomDrawer visible={visible} onClose={onClose}>
      <Text style={styles.drawerTitle}>{t.miscDisclaimer}</Text>
      <ScrollView style={styles.disclaimerScroll}>
        <Text style={styles.disclaimerBody}>{t.miscDisclaimerContent}</Text>
      </ScrollView>
      <Button onPress={onClose} textColor="white" style={styles.closeButton}>
        {t.miscClose}
      </Button>
    </BottomDrawer>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function OtherScreen() {
  const insets = useSafeAreaInsets();
  const { locale } = useLanguage();
  const t = i18n[locale];

  const [openDrawer, setOpenDrawer] = useState<
    "language" | "feedback" | "disclaimer" | null
  >(null);
  const [lastSent, setLastSent] = useState<number | null>(null);

  const close = () => setOpenDrawer(null);

  return (
    <ParallaxScrollView noheader={true}>
      <Surface
        style={[styles.container, { paddingTop: insets.top }]}
        elevation={0}
      >
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">{t.miscTitle}</ThemedText>
        </ThemedView>
        <View style={styles.sectionAccent} />

        <List.Section>
          <List.Subheader>{t.miscSettings}</List.Subheader>
          <List.Item
            title={t.language}
            description={LOCALE_LABELS[locale]}
            left={(props) => (
              <List.Icon {...props} icon="translate" color="#128AFA" />
            )}
            onPress={() => setOpenDrawer("language")}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
        </List.Section>

        <Divider style={styles.divider} />

        <List.Section>
          <List.Subheader>{t.miscSupport}</List.Subheader>
          <List.Item
            title={t.miscFeedbackItem}
            description={t.miscFeedbackItemDesc}
            left={(props) => (
              <List.Icon {...props} icon="message-text" color="#128AFA" />
            )}
            onPress={() => setOpenDrawer("feedback")}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
        </List.Section>

        <Divider style={styles.divider} />

        <List.Section style={styles.aboutSection}>
          <List.Subheader>{t.miscAboutSection}</List.Subheader>
          <List.Item
            title={t.miscVersion}
            description={Constants.expoConfig?.version ?? Application.nativeApplicationVersion ?? "1.0.4"}
            left={(props) => <List.Icon {...props} icon="information" />}
          />
          <List.Item
            title={t.miscDisclaimer}
            description={t.miscDisclaimerTap}
            left={(props) => <List.Icon {...props} icon="hand-front-right" />}
            onPress={() => setOpenDrawer("disclaimer")}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
        </List.Section>

        <Divider style={styles.divider} />
        <InlineAd />
      </Surface>

      <LanguageDrawer
        visible={openDrawer === "language"}
        onClose={close}
        t={t}
      />
      <FeedbackDrawer
        visible={openDrawer === "feedback"}
        onClose={close}
        t={t}
        lastSent={lastSent}
        onSent={() => {
          setLastSent(Date.now());
          close();
        }}
      />
      <DisclaimerDrawer
        visible={openDrawer === "disclaimer"}
        onClose={close}
        t={t}
      />
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionAccent: {
    width: 44,
    height: 2.5,
    backgroundColor: "#128AFA",
    borderRadius: 2,
    marginBottom: 16,
  },
  divider: { marginVertical: 8 },
  titleContainer: { flexDirection: "row", gap: 8 },
  aboutSection: { marginBottom: 8 },

  // Drawer
  drawerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  drawerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0D1F3C",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 12,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(18, 138, 250, 0.3)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 16,
  },
  drawerItem: { paddingVertical: 2 },
  drawerItemLabel: { color: "white", fontSize: 15 },
  drawerButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 16,
  },
  closeButton: { marginTop: 12 },

  // Feedback inputs
  input: {
    backgroundColor: "rgba(10, 22, 40, 0.9)",
    marginTop: 8,
  },
  descInput: { minHeight: 100 },

  // Disclaimer
  disclaimerScroll: { maxHeight: 200, marginBottom: 8 },
  disclaimerBody: { color: "rgba(255,255,255,0.6)", lineHeight: 22 },
});
