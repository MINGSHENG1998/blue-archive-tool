import React, { useState } from "react";
import { Menu, Button } from "react-native-paper";
import { useLanguage } from "@/contexts/language-context";
import { i18n, type Locale } from "@/constants/i18n";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  zh: "中文",
  ko: "한국어",
  ja: "日本語",
};

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const [visible, setVisible] = useState(false);
  const t = i18n[locale];

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <Button
          mode="text"
          compact
          onPress={() => setVisible(true)}
          labelStyle={{ fontSize: 13 }}
        >
          {LOCALE_LABELS[locale]}
        </Button>
      }
    >
      {(Object.entries(LOCALE_LABELS) as [Locale, string][]).map(
        ([code, label]) => (
          <Menu.Item
            key={code}
            title={label}
            onPress={() => {
              setLocale(code);
              setVisible(false);
            }}
            trailingIcon={locale === code ? "check" : undefined}
          />
        ),
      )}
    </Menu>
  );
}
