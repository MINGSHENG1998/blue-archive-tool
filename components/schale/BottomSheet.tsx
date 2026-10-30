import { useEffect, useMemo, type ReactNode } from "react";
import { KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SPRING_SLIDE } from "@/constants/motion";
import { commonStrings } from "@/constants/strings/common";
import { useStrings } from "@/constants/strings/define";
import { useType } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { Icon } from "./Icon";
import { shouldDismissSheet } from "./sheetGesture";

export function BottomSheet({ visible, onClose, title, children, scrollable = true }: {
  visible: boolean; onClose: () => void; title?: string; children: ReactNode; scrollable?: boolean;
}) {
  const c = useColors();
  const type = useType();
  const s = useStrings(commonStrings);
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => { if (visible) { y.value = reduced ? 0 : 48; y.value = withTiming(0, { duration: reduced ? 0 : 220 }); } }, [visible, reduced, y]);
  const motion = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderMove: (_, gesture) => { y.value = Math.max(0, gesture.dy); },
    onPanResponderRelease: (_, gesture) => {
      if (shouldDismissSheet(gesture.dy, gesture.vy)) onClose();
      else y.value = reduced ? 0 : withSpring(0, SPRING_SLIDE);
    },
    onPanResponderTerminate: () => { y.value = 0; },
  }), [onClose, reduced, y]);
  return <Modal visible={visible} transparent animationType={reduced ? "none" : "fade"} onRequestClose={onClose} statusBarTranslucent>
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.root}>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: c.overlay }]} onPress={onClose} accessibilityRole="button" accessibilityLabel={s.close} />
      <Animated.View accessibilityViewIsModal onAccessibilityEscape={onClose} style={[styles.sheet, { backgroundColor: c.elevatedBg, borderColor: c.hairline, paddingBottom: Math.max(insets.bottom, 16) }, motion]}>
        <View {...pan.panHandlers} style={styles.drag} accessible accessibilityLabel={s.dragToClose}>
          <View style={[styles.handle, { backgroundColor: c.primaryA28 }]} />
        </View>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={[type.title, { color: c.textPrimary, flex: 1 }]}>{title}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={s.close} style={styles.close} onPress={onClose}>
            <Icon name="close" color={c.textPrimary} size={24} />
          </Pressable>
        </View>
        {scrollable ? <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>{children}</ScrollView> : <View style={styles.body}>{children}</View>}
      </Animated.View>
    </KeyboardAvoidingView>
  </Modal>;
}
const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  sheet: { maxHeight: "90%", borderTopLeftRadius: 12, borderTopRightRadius: 12, borderWidth: 1, width: "100%", maxWidth: 720, alignSelf: "center" },
  drag: { minHeight: 28, alignItems: "center", justifyContent: "center" },
  handle: { width: 44, height: 4, borderRadius: 2 },
  header: { flexDirection: "row", alignItems: "center", paddingLeft: 20, paddingRight: 8, paddingBottom: 8 },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  body: { paddingHorizontal: 20, paddingBottom: 12 },
});
