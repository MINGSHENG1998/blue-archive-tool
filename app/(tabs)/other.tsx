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
import { memo, useRef, useState, useEffect, useMemo } from "react";
import {
  List,
  Divider,
  Surface,
  Button,
  Text,
  TextInput,
  HelperText,
  RadioButton,
  ActivityIndicator,
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
import { useAdFreeContext } from "@/contexts/ad-free-context";
import { TIP_SKUS } from "@/hooks/useAdFree";
import { useColors } from "@/hooks/useColors";
import type { ThemeTokens } from "@/constants/theme";
import { useTheme } from "@/contexts/theme-context";
import { THEMES, THEME_ORDER, type ThemeId } from "@/constants/theme";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  ko: "한국어",
  ja: "日本語",
};

const FEEDBACK_COOLDOWN_MS = 3 * 60 * 60 * 1000;
const SCREEN_HEIGHT = Dimensions.get("window").height;

const makeStyles = (c: ThemeTokens) =>
  StyleSheet.create({
    container: { flex: 1 },
    sectionAccent: {
      width: 44,
      height: 2.5,
      backgroundColor: c.primaryColor,
      borderRadius: 2,
      marginBottom: 16,
    },
    divider: { marginVertical: 8 },
    titleContainer: { flexDirection: "row", gap: 8 },
    aboutSection: { marginBottom: 8 },

    // Drawer
    drawerOverlay: {
      flex: 1,
      backgroundColor: c.overlay,
    },
    drawerContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: c.elevatedBg,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 24,
      paddingBottom: 36,
      paddingTop: 12,
    },
    drawerHandle: {
      width: 40,
      height: 4,
      backgroundColor: c.accentSoft,
      borderRadius: 2,
      alignSelf: "center",
      marginBottom: 20,
    },
    drawerTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: c.textPrimary,
      marginBottom: 16,
    },
    drawerItem: { paddingVertical: 2 },
    drawerItemLabel: { color: c.textPrimary, fontSize: 15 },
    drawerButtons: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 16,
    },
    closeButton: { marginTop: 12 },

    // Feedback inputs
    input: {
      backgroundColor: c.surfaceBg,
      marginTop: 8,
    },
    descInput: { minHeight: 100 },

    // Disclaimer
    disclaimerScroll: { maxHeight: 200, marginBottom: 8 },
    disclaimerBody: { color: c.textMuted, lineHeight: 22 },

    // Theme picker
    themeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingRight: 8,
    },
    themeRowLeft: { flexDirection: "row", alignItems: "center" },
    themeRowLabel: { fontSize: 15 },

    // Coffee drawer
    coffeeDesc: {
      color: c.textMuted,
      fontSize: 13,
      marginBottom: 20,
    },
    coffeeTierRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16,
    },
    coffeeTierCard: {
      flex: 1,
      borderRadius: 14,
      padding: 16,
      alignItems: "center",
    },
    coffeeTierCardSmall: {
      backgroundColor: c.accentSoft,
      borderWidth: 1.5,
      borderColor: c.accentSoft,
      paddingTop: 20,
    },
    coffeeTierCardLarge: {
      backgroundColor: c.accentSoft,
      borderWidth: 2,
      borderColor: c.primaryColor,
      paddingTop: 20,
    },
    coffeeBadgeContainer: {
      position: "absolute",
      top: -11,
      left: 0,
      right: 0,
      alignItems: "center",
    },
    coffeeBadge: {
      backgroundColor: c.primaryColor,
      color: c.primaryText,
      fontSize: 10,
      fontWeight: "700",
      paddingHorizontal: 10,
      paddingVertical: 2,
      borderRadius: 99,
      overflow: "hidden",
    },
    coffeeTierEmoji: {
      fontSize: 28,
      marginBottom: 4,
    },
    coffeeTierPrice: {
      color: c.textPrimary,
      fontWeight: "700",
      fontSize: 16,
    },
    coffeeTierLabel: {
      color: c.textMuted,
      fontSize: 11,
      marginTop: 4,
      marginBottom: 10,
    },
    coffeeTierButton: {
      width: "100%",
      borderRadius: 8,
    },
    coffeeTierButtonLabel: {
      fontSize: 13,
    },
    coffeePurchasing: {
      height: 120,
      justifyContent: "center",
      alignItems: "center",
    },
    coffeeAdFreeNote: {
      backgroundColor: c.accentSoft,
      borderWidth: 1,
      borderColor: c.accentSoft,
      borderRadius: 10,
      padding: 10,
      marginBottom: 4,
    },
    coffeeAdFreeNoteText: {
      color: c.textSecondary,
      fontSize: 13,
    },
    coffeeRestoreMsg: {
      textAlign: "center",
    },
    coffeeAlreadyOwned: {
      backgroundColor: c.accentSoft,
      borderWidth: 1,
      borderColor: c.accentSoft,
      borderRadius: 10,
      padding: 16,
      alignItems: "center",
      marginVertical: 8,
    },
    coffeeAlreadyOwnedText: {
      color: c.textPrimary,
      fontSize: 15,
      textAlign: "center",
    },
    coffeeSuccess: {
      alignItems: "center",
      paddingVertical: 16,
    },
    coffeeSuccessEmoji: {
      fontSize: 48,
      marginBottom: 12,
    },
    coffeeSuccessDesc: {
      color: c.textMuted,
      fontSize: 14,
      marginBottom: 24,
      textAlign: "center",
    },
    coffeeDoneButton: {
      borderRadius: 10,
      paddingHorizontal: 16,
    },
  });

// ── Theme swatches ──────────────────────────────────────────────────────────
function ThemeSwatches({ id }: { id: ThemeId }) {
  const tk = THEMES[id].tokens;
  const swatches = [tk.appBg, tk.surfaceBg, tk.primaryColor, tk.textPrimary];
  return (
    <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
      {swatches.map((color, i) => (
        <View
          key={i}
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            backgroundColor: color,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: tk.surfaceBorder,
          }}
        />
      ))}
    </View>
  );
}

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
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const insets = useSafeAreaInsets();

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
        style={[
          styles.drawerContainer,
          { paddingBottom: 36 + insets.bottom },
          { transform: [{ translateY }] },
        ]}
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
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
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
              color={c.primaryColor}
              labelStyle={styles.drawerItemLabel}
              style={styles.drawerItem}
            />
          )
        )}
      </RadioButton.Group>
    </BottomDrawer>
  );
}

// ── Theme drawer ─────────────────────────────────────────────────────────────
function ThemeDrawer({
  visible,
  onClose,
  t,
}: {
  visible: boolean;
  onClose: () => void;
  t: UIStrings;
}) {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { themeId, setThemeId } = useTheme();
  return (
    <BottomDrawer visible={visible} onClose={onClose}>
      <Text style={styles.drawerTitle}>{t.theme}</Text>
      {THEME_ORDER.map((id) => (
        <TouchableWithoutFeedback
          key={id}
          onPress={() => {
            setThemeId(id);
            onClose();
          }}
        >
          <View style={styles.themeRow}>
            <View style={styles.themeRowLeft}>
              <RadioButton
                value={id}
                status={themeId === id ? "checked" : "unchecked"}
                color={c.primaryColor}
                onPress={() => {
                  setThemeId(id);
                  onClose();
                }}
              />
              <Text style={[styles.drawerItemLabel, styles.themeRowLabel]}>
                {THEMES[id].name}
              </Text>
            </View>
            <ThemeSwatches id={id} />
          </View>
        </TouchableWithoutFeedback>
      ))}
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
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
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
        outlineColor={c.accentSoft}
        activeOutlineColor={c.primaryColor}
        textColor={c.textPrimary}
        theme={{ colors: { onSurfaceVariant: c.textMuted } }}
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
        outlineColor={c.accentSoft}
        activeOutlineColor={c.primaryColor}
        textColor={c.textPrimary}
        theme={{ colors: { onSurfaceVariant: c.textMuted } }}
        error={!!descError}
      />
      {!!descError && (
        <HelperText type="error" visible>
          {descError}
        </HelperText>
      )}

      <View style={styles.drawerButtons}>
        <Button onPress={onClose} textColor={c.textMuted} disabled={sending}>
          {t.miscCancel}
        </Button>
        <Button
          mode="contained"
          onPress={validateAndSend}
          loading={sending}
          disabled={sending}
          buttonColor={c.primaryColor}
          textColor={c.primaryText}
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
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <BottomDrawer visible={visible} onClose={onClose}>
      <Text style={styles.drawerTitle}>{t.miscDisclaimer}</Text>
      <ScrollView style={styles.disclaimerScroll}>
        <Text style={styles.disclaimerBody}>{t.miscDisclaimerContent}</Text>
      </ScrollView>
      <Button
        onPress={onClose}
        textColor={c.textPrimary}
        style={styles.closeButton}
      >
        {t.miscClose}
      </Button>
    </BottomDrawer>
  );
}

// ── Coffee drawer ────────────────────────────────────────────────────────────
type CoffeeState = "idle" | "purchasing" | "success";

const CoffeeDrawer = memo(function CoffeeDrawer({
  visible,
  onClose,
  t,
}: {
  visible: boolean;
  onClose: () => void;
  t: UIStrings;
}) {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { isAdFree, purchaseTip, restorePurchase } = useAdFreeContext();
  const [drawerState, setDrawerState] = useState<CoffeeState>("idle");
  const [error, setError] = useState("");
  const [restoreMsg, setRestoreMsg] = useState("");
  const [restoreStatus, setRestoreStatus] = useState<"success" | "fail" | null>(null);

  useEffect(() => {
    if (!visible) {
      setDrawerState("idle");
      setError("");
      setRestoreMsg("");
      setRestoreStatus(null);
    }
  }, [visible]);

  const handlePurchase = async (sku: string) => {
    setDrawerState("purchasing");
    setError("");
    try {
      const result = await purchaseTip(sku);
      if (result === "success") setDrawerState("success");
      else setDrawerState("idle");
    } catch (err) {
      setError(typeof err === "string" ? err : String(err));
      setDrawerState("idle");
    }
  };

  const handleRestore = async () => {
    setRestoreMsg("");
    setRestoreStatus(null);
    try {
      const result = await restorePurchase();
      if (result === "success") {
        setRestoreMsg(t.miscCoffeeRestoreSuccess);
        setRestoreStatus("success");
      } else {
        setRestoreMsg(t.miscCoffeeRestoreFail);
        setRestoreStatus("fail");
      }
    } catch {
      setRestoreMsg(t.miscCoffeeRestoreFail);
      setRestoreStatus("fail");
    }
  };

  return (
    <BottomDrawer visible={visible} onClose={onClose}>
      {drawerState === "success" ? (
        <View style={styles.coffeeSuccess}>
          <Text style={styles.coffeeSuccessEmoji}>🙏</Text>
          <Text style={styles.drawerTitle}>{t.miscCoffeeThankYouTitle}</Text>
          <Text style={styles.coffeeSuccessDesc}>{t.miscCoffeeThankYouDesc}</Text>
          <Button
            mode="contained"
            onPress={onClose}
            buttonColor={c.primaryColor}
            textColor={c.primaryText}
            style={styles.coffeeDoneButton}
          >
            {t.miscCoffeeDone}
          </Button>
        </View>
      ) : (
        <>
          <Text style={styles.drawerTitle}>☕ {t.miscCoffeeDrawerTitle}</Text>
          <Text style={styles.coffeeDesc}>{t.miscCoffeeDrawerDesc}</Text>

          {isAdFree && (
            <View style={styles.coffeeAlreadyOwned}>
              <Text style={styles.coffeeAlreadyOwnedText}>
                ✨ {t.miscCoffeeAlreadyOwned}
              </Text>
            </View>
          )}

          <>
            {drawerState === "purchasing" ? (
              <View style={styles.coffeePurchasing}>
                <ActivityIndicator color={c.primaryColor} />
              </View>
            ) : (
              <View style={styles.coffeeTierRow}>
                  {/* Small tier */}
                  <View style={[styles.coffeeTierCard, styles.coffeeTierCardSmall]}>
                    <Text style={styles.coffeeTierEmoji}>☕</Text>
                    <Text style={styles.coffeeTierPrice}>$2.99</Text>
                    <Text style={styles.coffeeTierLabel}>{t.miscCoffeeSmallLabel}</Text>
                    <Button
                      mode="contained"
                      onPress={() => handlePurchase(TIP_SKUS.SMALL)}
                      buttonColor={c.primaryColor}
                      textColor={c.primaryText}
                      style={styles.coffeeTierButton}
                      labelStyle={styles.coffeeTierButtonLabel}
                    >
                      {t.miscCoffeeButton}
                    </Button>
                  </View>

                  {/* Large tier */}
                  <View style={[styles.coffeeTierCard, styles.coffeeTierCardLarge]}>
                    <View style={styles.coffeeBadgeContainer}>
                      <Text style={styles.coffeeBadge}>{t.miscCoffeeBadge}</Text>
                    </View>
                    <Text style={styles.coffeeTierEmoji}>🍗</Text>
                    <Text style={styles.coffeeTierPrice}>$5.99</Text>
                    <Text style={styles.coffeeTierLabel}>{t.miscCoffeeLargeLabel}</Text>
                    <Button
                      mode="contained"
                      onPress={() => handlePurchase(TIP_SKUS.LARGE)}
                      buttonColor={c.primaryColor}
                      textColor={c.primaryText}
                      style={styles.coffeeTierButton}
                      labelStyle={styles.coffeeTierButtonLabel}
                    >
                      {t.miscCoffeeButton}
                    </Button>
                  </View>
                </View>
              )}

              {!!error && (
                <HelperText type="error" visible>
                  {error}
                </HelperText>
              )}

              <View style={styles.coffeeAdFreeNote}>
                <Text style={styles.coffeeAdFreeNoteText}>
                  ✨ {t.miscCoffeeAdFreeNote}
                </Text>
              </View>

              {!isAdFree && (
                <Button
                  mode="text"
                  onPress={handleRestore}
                  textColor={c.primaryColor}
                  disabled={drawerState === "purchasing"}
                >
                  {t.miscCoffeeRestore}
                </Button>
              )}

              {!!restoreMsg && (
                <HelperText
                  type={restoreStatus === "success" ? "info" : "error"}
                  visible
                  style={styles.coffeeRestoreMsg}
                >
                  {restoreMsg}
                </HelperText>
              )}
            </>
        </>
      )}
    </BottomDrawer>
  );
});

// ── Main screen ──────────────────────────────────────────────────────────────
export default function OtherScreen() {
  const insets = useSafeAreaInsets();
  const { locale } = useLanguage();
  const t = i18n[locale];
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { themeId, theme } = useTheme();

  const [openDrawer, setOpenDrawer] = useState<
    "language" | "theme" | "feedback" | "disclaimer" | "coffee" | null
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
              <List.Icon
                {...props}
                icon="translate"
                color={theme.tokens.primaryColor}
              />
            )}
            onPress={() => setOpenDrawer("language")}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <List.Item
            title={t.theme}
            description={THEMES[themeId].name}
            left={(props) => (
              <List.Icon
                {...props}
                icon="palette"
                color={theme.tokens.primaryColor}
              />
            )}
            onPress={() => setOpenDrawer("theme")}
            right={() => <ThemeSwatches id={themeId} />}
          />
        </List.Section>

        <Divider style={styles.divider} />

        <List.Section>
          <List.Subheader>{t.miscSupport}</List.Subheader>
          <List.Item
            title={t.miscFeedbackItem}
            description={t.miscFeedbackItemDesc}
            left={(props) => (
              <List.Icon
                {...props}
                icon="message-text"
                color={theme.tokens.primaryColor}
              />
            )}
            onPress={() => setOpenDrawer("feedback")}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <List.Item
            title={t.miscCoffeeItem}
            description={t.miscCoffeeItemDesc}
            left={(props) => (
              <List.Icon {...props} icon="coffee" color={theme.tokens.primaryColor} />
            )}
            onPress={() => setOpenDrawer("coffee")}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
        </List.Section>

        <Divider style={styles.divider} />

        <List.Section style={styles.aboutSection}>
          <List.Subheader>{t.miscAboutSection}</List.Subheader>
          <List.Item
            title={t.miscVersion}
            description={
              Constants.expoConfig?.version ??
              Application.nativeApplicationVersion ??
              "1.0.7"
            }
            left={(props) => <List.Icon {...props} icon="information" />}
          />
          <List.Item
            title={t.miscDisclaimer}
            description={t.miscDisclaimerTap}
            left={(props) => (
              <List.Icon {...props} icon="hand-front-right" />
            )}
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
      <ThemeDrawer
        visible={openDrawer === "theme"}
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
      <CoffeeDrawer
        visible={openDrawer === "coffee"}
        onClose={close}
        t={t}
      />
    </ParallaxScrollView>
  );
}
