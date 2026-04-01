import {
  StyleSheet,
  Image,
  View,
  ScrollView,
  Animated,
  Pressable,
  Text,
} from "react-native";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
  Card,
  Chip,
  Surface,
  Searchbar,
  Menu,
  Button,
  ActivityIndicator,
} from "react-native-paper";
import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColor } from "@/hooks/useThemeColor";
import { typeColor } from "@/constants/Colors";
import { AtkType, DefType } from "@/dto/game.dto";
import CustomChip from "@/components/ui/customChip";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import React from "react";
import InlineAd from "../ads/InlineAd";
import { useLanguage } from "@/contexts/language-context";
import { i18n, atkTypeLabels, defTypeLabels } from "@/constants/i18n";
import type { Locale } from "@/constants/i18n";

// Define types
interface Character {
  id: string;
  name: string;
  image: string;
  rarity: number;
  atkType: AtkType;
  defType: DefType;
  isNew?: boolean;
  isLimited?: boolean;
  class: string;
  translations?: Record<string, { name?: string }>;
}

interface Banner {
  id: string;
  startDate: string;
  endDate: string;
  characters: Character[];
  type: "New" | "Rerun" | "Fes" | "Collab";
  eventDetails?: string;
  rewards?: string[];
}

// Filter types
type SortOption = "date-asc" | "date-desc" | "rarity";
type FilterType = "New" | "Rerun" | "Fes" | "Collab" | "All";

function getCharacterName(char: Character, locale: Locale): string {
  if (locale === "en") return char.name;
  return char.translations?.[locale]?.name || char.name;
}

const CharacterClassBadge = ({ classType }: { classType: string }) => {
  const getBadgeStyle = () => {
    if (classType.toLowerCase() === "striker") {
      return styles.strikerBadge;
    } else if (classType.toLowerCase() === "special") {
      return styles.specialBadge;
    }
    return styles.defaultBadge;
  };

  return (
    <View style={[styles.classBadge, getBadgeStyle()]}>
      <ThemedText type="small" style={styles.classText}>
        {classType.toUpperCase()}
      </ThemedText>
    </View>
  );
};

const AnimatedCard = ({ children, style, ...props }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...props}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

const BannerTypeChip = ({ type }: { type: string }) => {
  const getTypeStyle = () => {
    switch (type) {
      case "New":
        return styles.newTypeChip;
      case "Fes":
        return styles.fesTypeChip;
      case "Collab":
        return styles.collabTypeChip;
      case "Rerun":
        return styles.rerunTypeChip;
      default:
        return styles.defaultTypeChip;
    }
  };

  return (
    <View style={[styles.bannerTypeChip, getTypeStyle()]}>
      <ThemedText type="small" style={styles.bannerTypeText}>
        {type.toUpperCase()}
      </ThemedText>
    </View>
  );
};

const PortraitStrip = ({ characters }: { characters: Character[] }) => {
  const visible = characters.slice(0, 3);
  const overflow = characters.length - 3;

  return (
    <View style={portraitStyles.strip}>
      {visible.map((char, index) => (
        <Image
          key={char.id}
          source={{ uri: char.image }}
          style={[
            portraitStyles.avatar,
            { marginLeft: index === 0 ? 0 : -18 },
          ]}
        />
      ))}
      {overflow > 0 && (
        <View style={[portraitStyles.avatar, portraitStyles.overflowCircle, { marginLeft: -18 }]}>
          <Text style={portraitStyles.overflowText}>+{overflow}</Text>
        </View>
      )}
    </View>
  );
};

const portraitStyles = StyleSheet.create({
  strip: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "rgba(18, 138, 250, 0.35)",
    backgroundColor: "#0F2347",
  },
  overflowCircle: {
    backgroundColor: "rgba(18, 138, 250, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  overflowText: {
    color: "#128AFA",
    fontSize: 13,
    fontWeight: "700",
  },
});

export default function FutureBannerScreen() {
  const scrollRef = useRef<{ resetScroll: () => void }>(null);
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, "background");
  const cardBackground = useThemeColor({}, "background");
  const { locale } = useLanguage();
  const t = i18n[locale];

  // State
  const [expandedBanner, setExpandedBanner] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("date-asc");
  const [filterType, setFilterType] = useState<FilterType>("All");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Format helpers
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysUntil = (dateString: string) => {
    const targetDate = new Date(dateString);
    const now = new Date();
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);

      const [bannersSnap, charsSnap] = await Promise.all([
        getDocs(collection(db, "banners")),
        getDocs(collection(db, "characters")),
      ]);

      const charMap = new Map<string, Character>(
        charsSnap.docs.map((d: any) => [d.id, { id: d.id, ...d.data() } as Character]),
      );

      const currentDateTime = new Date();
      const bannersData = bannersSnap.docs
        .map((docSnap: any) => {
          const data = docSnap.data();

          // Resolve characters: prefer characterIds join, fall back to embedded array
          const fromIds: Character[] = (data.characterIds ?? [])
            .map((id: string) => charMap.get(id))
            .filter(Boolean) as Character[];
          const characters: Character[] =
            fromIds.length > 0 ? fromIds : (data.characters || []);

          return {
            id: docSnap.id,
            startDate: data.startDate,
            endDate: data.endDate,
            type: data.type,
            characters,
          };
        })
        .filter((banner: any) => {
          const endDate = new Date(banner.endDate);
          return !isNaN(endDate.getTime()) && endDate > currentDateTime;
        });

      setBanners(bannersData);
    } catch {
      setError(t.errorText);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchBanners();
    } finally {
      setRefreshing(false);
    }
  }, [fetchBanners]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // Filter and sort logic
  const filteredAndSortedBanners = useMemo(() => {
    let result = [...banners];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((banner) =>
        banner.characters.some((char) => {
          const translated = getCharacterName(char, locale).toLowerCase();
          return (
            char.name.toLowerCase().includes(query) ||
            translated.includes(query)
          );
        }),
      );
    }

    if (filterType !== "All") {
      result = result.filter((banner) => banner.type === filterType);
    }

    switch (sortOption) {
      case "date-asc":
        result.sort(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
        break;
      case "date-desc":
        result.sort(
          (a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
        break;
      case "rarity":
        result.sort((a, b) => {
          const maxA = Math.max(...a.characters.map((c) => c.rarity));
          const maxB = Math.max(...b.characters.map((c) => c.rarity));
          return maxB - maxA;
        });
        break;
    }

    return result;
  }, [banners, searchQuery, filterType, sortOption, locale]);

  const renderCharacterCard = (character: Character) => (
    <AnimatedCard key={character.id} style={styles.characterCardWrapper}>
      <Card style={[styles.characterCard, { backgroundColor: cardBackground }]}>
        <Card.Content style={styles.characterContent}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: character.image }}
              style={styles.characterImage}
            />
            {character.isLimited && (
              <View style={styles.limitedOverlay}>
                <Image
                  source={require("@/assets/images/characters/limited_icon.png")}
                  style={styles.limitedBadge}
                />
              </View>
            )}
            {character.isNew && (
              <View style={styles.newBadge}>
                <ThemedText style={styles.newBadgeText}>NEW</ThemedText>
              </View>
            )}
            {character?.class && (
              <View style={styles.classContainer}>
                <CharacterClassBadge classType={character.class} />
              </View>
            )}
          </View>
          <View style={styles.characterInfo}>
            <ThemedView style={styles.characterHeader}>
              <ThemedText
                type="cardtitle"
                style={styles.characterName}
                numberOfLines={2}
              >
                {getCharacterName(character, locale)}
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.tags}>
              <CustomChip
                bgColor={typeColor[character.atkType]?.background}
                icon={typeColor[character.atkType]?.icon}
                label={atkTypeLabels[character.atkType]?.[locale] ?? character.atkType}
              />
              <CustomChip
                bgColor={typeColor[character.defType]?.background}
                icon={typeColor[character.defType]?.icon}
                label={defTypeLabels[character.defType]?.[locale] ?? character.defType}
              />
            </ThemedView>
          </View>
        </Card.Content>
      </Card>
    </AnimatedCard>
  );

  if (loading && !refreshing) {
    return (
      <Surface
        style={[styles.container, { paddingTop: insets.top }]}
        elevation={0}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#128AFA" />
          <ThemedText type="default" style={styles.loadingText}>
            {t.loading}
          </ThemedText>
        </View>
      </Surface>
    );
  }

  return (
    <ParallaxScrollView
      noheader={true}
      keyboardShouldPersistTaps="handled"
      ref={scrollRef}
      onRefresh={onRefresh}
      refreshing={refreshing}
    >
      <View style={styles.backgroundPattern} />
      <Surface
        style={[styles.container, { paddingTop: insets.top, backgroundColor }]}
        elevation={0}
      >
        <ThemedView style={styles.titleContainer}>
          <View style={{ flex: 1 }}>
            <ThemedText type="title" style={styles.mainTitle}>
              {t.pageTitle}
            </ThemedText>
            <View style={styles.sectionAccent} />
          </View>
          <View style={styles.titleActions}>
            <Button
              icon="refresh"
              mode="text"
              compact={true}
              onPress={onRefresh}
              loading={refreshing}
              disabled={refreshing}
              labelStyle={styles.refreshBtnLabel}
              contentStyle={styles.refreshBtnContent}
              buttonColor="rgba(0, 245, 255, 0.1)"
            >
              {""}
            </Button>
          </View>
        </ThemedView>

        {error ? (
          <View style={styles.errorContainer}>
            <ThemedText type="default" style={styles.errorText}>
              {error}
            </ThemedText>
            <Button
              mode="contained"
              onPress={fetchBanners}
              buttonColor="#128AFA"
              textColor="#0F172A"
            >
              {t.retryButton}
            </Button>
          </View>
        ) : (
          <>
            {/* Search and Filter Section */}
            <View style={styles.filterPanel}>
              <Searchbar
                placeholder={t.searchPlaceholder}
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
                inputStyle={styles.searchInput}
                iconColor="#128AFA"
              />

              <View style={styles.filterRow}>
                <Menu
                  visible={showSortMenu}
                  onDismiss={() => setShowSortMenu(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setShowSortMenu(true)}
                      icon="sort"
                      style={styles.sortButton}
                      labelStyle={styles.sortButtonLabel}
                    >
                      {t.sortButton}
                    </Button>
                  }
                  contentStyle={styles.menuContent}
                >
                  <Menu.Item
                    onPress={() => {
                      setSortOption("date-asc");
                      setShowSortMenu(false);
                    }}
                    title={t.sortEarliest}
                  />
                  <Menu.Item
                    onPress={() => {
                      setSortOption("date-desc");
                      setShowSortMenu(false);
                    }}
                    title={t.sortLatest}
                  />
                </Menu>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.filterChips}
                  contentContainerStyle={styles.filterChipsContent}
                >
                  {(
                    [
                      { type: "All" as FilterType, label: t.filterAll },
                      { type: "New" as FilterType, label: t.filterNew },
                      { type: "Rerun" as FilterType, label: t.filterRerun },
                      { type: "Fes" as FilterType, label: t.filterFes },
                      { type: "Collab" as FilterType, label: t.filterCollab },
                    ]
                  ).map(({ type, label }) => (
                    <Chip
                      key={type}
                      selected={filterType === type}
                      selectedColor="#0F172A"
                      onPress={() => setFilterType(type)}
                      style={[
                        styles.filterChip,
                        filterType === type && styles.selectedFilterChip,
                      ]}
                      textStyle={[
                        styles.filterChipText,
                        filterType === type && styles.selectedFilterChipText,
                      ]}
                    >
                      {label}
                    </Chip>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Banners List */}
            <View style={styles.bannerList}>
              {filteredAndSortedBanners.map((banner) => {
                const daysUntil = getDaysUntil(banner.startDate);
                const isActive =
                  daysUntil <= 0 && getDaysUntil(banner.endDate) > 0;
                const isExpanded = expandedBanner === banner.id;

                return (
                  <AnimatedCard
                    key={banner.id}
                    style={styles.bannerCardWrapper}
                    onPress={() =>
                      setExpandedBanner(isExpanded ? null : banner.id)
                    }
                  >
                    <View
                      style={[
                        styles.bannerCard,
                        isActive && styles.activeBannerCard,
                      ]}
                    >
                      {/* Badge Row */}
                      <View style={styles.bannerBadgeRow}>
                        <View style={styles.bannerBadgeLeft}>
                          <BannerTypeChip type={banner.type} />
                          {isActive && (
                            <View style={styles.liveBadge}>
                              <ThemedText style={styles.liveBadgeText}>
                                LIVE
                              </ThemedText>
                            </View>
                          )}
                          {daysUntil > 0 && (
                            <View style={styles.countdownBadge}>
                              <ThemedText style={styles.countdownText}>
                                {daysUntil}d
                              </ThemedText>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Info Row */}
                      <View style={styles.bannerInfoRow}>
                        <Text style={styles.bannerTitle} numberOfLines={2}>
                          {banner.characters.length > 0
                            ? `${getCharacterName(banner.characters[0], locale)} — ${banner.type} ${t.bannerSuffix}`
                            : `${banner.type} ${t.bannerSuffix}`}
                        </Text>
                        <Text style={styles.bannerDateRange}>
                          {formatDate(banner.startDate)} – {formatDate(banner.endDate)}
                        </Text>
                      </View>

                      {/* Preview Row */}
                      <View style={styles.bannerPreviewRow}>
                        <PortraitStrip characters={banner.characters} />
                        <View
                          style={[
                            styles.bannerChevron,
                            isExpanded && styles.bannerChevronExpanded,
                          ]}
                        >
                          <Text style={styles.bannerChevronText}>▼</Text>
                        </View>
                      </View>

                      {/* Expanded Character List */}
                      {isExpanded && (
                        <>
                          <View style={styles.expandDivider} />
                          <View style={styles.charactersContainer}>
                            {banner.characters.map(renderCharacterCard)}
                          </View>
                        </>
                      )}
                    </View>
                  </AnimatedCard>
                );
              })}
            </View>
          </>
        )}
        <InlineAd />
      </Surface>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A1628",
  },
  backgroundPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0A1628",
    opacity: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: "#94A3B8",
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
    gap: 16,
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    borderRadius: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.2)",
  },
  errorText: {
    textAlign: "center",
    color: "#DC2626",
    fontSize: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "transparent",
    paddingHorizontal: 4,
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    fontStyle: "italic",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 2,
  },
  sectionAccent: {
    width: 44,
    height: 2.5,
    backgroundColor: "#128AFA",
    borderRadius: 2,
    marginTop: 6,
  },
  titleActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  refreshBtnContent: {
    marginHorizontal: 8,
    borderRadius: 50,
    padding: 8,
    flexDirection: "row-reverse",
  },
  refreshBtnLabel: {
    margin: 0,
    marginHorizontal: 0,
    color: "#128AFA",
  },
  filterPanel: {
    marginBottom: 24,
    backgroundColor: "rgba(10, 22, 40, 0.85)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(18, 138, 250, 0.12)",
    padding: 12,
    gap: 10,
  },
  searchBar: {
    backgroundColor: "rgba(10, 22, 40, 0.8)",
    borderRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(18, 138, 250, 0.18)",
  },
  searchInput: {
    color: "#FFFFFF",
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sortButton: {
    borderColor: "#475569",
    borderRadius: 8,
  },
  sortButtonLabel: {
    color: "#FFFFFF",
  },
  menuContent: {
    backgroundColor: "#0D1F3C",
    borderRadius: 8,
  },
  filterChips: {
    flexGrow: 1,
  },
  filterChipsContent: {
    paddingRight: 16,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: "rgba(18, 138, 250, 0.08)",
    borderRadius: 20,
    height: 32,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  selectedFilterChip: {
    backgroundColor: "#128AFA",
  },
  filterChipText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  selectedFilterChipText: {
    color: "#FFFFFF",
    fontWeight: "600",
    lineHeight: 16,
  },
  bannerList: {
    gap: 16,
    paddingBottom: 20,
  },
  bannerCardWrapper: {
    marginHorizontal: 2,
  },
  bannerCard: {
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: "rgba(15, 35, 71, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(18, 138, 250, 0.18)",
  },
  activeBannerCard: {
    borderColor: "#128AFA",
    borderWidth: 2,
    shadowColor: "#128AFA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  bannerBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  bannerBadgeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bannerInfoRow: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 4,
  },
  bannerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  bannerDateRange: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
  },
  bannerPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  bannerChevron: {
    justifyContent: "center",
    alignItems: "center",
    transform: [{ rotate: "0deg" }],
  },
  bannerChevronExpanded: {
    transform: [{ rotate: "180deg" }],
  },
  bannerChevronText: {
    color: "#94A3B8",
    fontSize: 12,
  },
  expandDivider: {
    height: 1,
    backgroundColor: "rgba(18, 138, 250, 0.12)",
    marginHorizontal: 0,
  },
  bannerTypeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    height: 24,
    justifyContent: "center",
  },
  newTypeChip: {
    backgroundColor: "#EF4444",
  },
  fesTypeChip: {
    backgroundColor: "#F59E0B",
  },
  collabTypeChip: {
    backgroundColor: "#8B5CF6",
  },
  rerunTypeChip: {
    backgroundColor: "#6B7280",
  },
  defaultTypeChip: {
    backgroundColor: "#475569",
  },
  bannerTypeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  liveBadge: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    height: 24,
    justifyContent: "center",
  },
  liveBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 16,
  },
  countdownBadge: {
    backgroundColor: "rgba(0, 245, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    height: 24,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#128AFA",
  },
  countdownText: {
    color: "#128AFA",
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 16,
  },
  charactersContainer: {
    gap: 12,
    padding: 12,
    backgroundColor: "rgba(10, 22, 40, 0.9)",
  },
  charactersTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  characterCardWrapper: {
    marginHorizontal: 2,
  },
  characterCard: {
    backgroundColor: "#0F2347",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(18, 138, 250, 0.18)",
  },
  characterContent: {
    flexDirection: "row",
    gap: 16,
    padding: 12,
  },
  imageContainer: {
    position: "relative",
  },
  characterImage: {
    width: 90,
    height: 90,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(148, 163, 184, 0.3)",
  },
  limitedOverlay: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#F59E0B",
    borderRadius: 20,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  limitedBadge: {
    width: 16,
    height: 16,
  },
  newContainer: {
    position: "absolute",
    top: -4,
    right: -4,
  },
  classContainer: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "center",
  },
  rarityContainer: {
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderRadius: 8,
    paddingVertical: 1,
  },
  star: {
    color: "#FFD700",
    fontSize: 12,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  characterInfo: {
    flex: 1,
    paddingVertical: 4,
  },
  characterHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  characterName: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  newBadge: {
    position: "absolute",
    top: -4,
    left: -8,
    backgroundColor: "#EAB308",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  classBadge: {
    backgroundColor: "#374151",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  strikerBadge: {
    backgroundColor: "#EF4444",
  },
  specialBadge: {
    backgroundColor: "#3B82F6",
  },
  defaultBadge: {
    backgroundColor: "#6B7280",
  },
  classText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  tags: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
});
