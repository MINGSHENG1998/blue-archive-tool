import {
  StyleSheet,
  Image,
  View,
  ScrollView,
  RefreshControl,
  Animated,
  Pressable,
  Dimensions,
} from "react-native";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
  Card,
  Chip,
  Surface,
  List,
  Searchbar,
  Menu,
  Button,
  Divider,
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

const { width } = Dimensions.get("window");

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
type SortOption = "date-asc" | "date-desc" | "name" | "rarity";
type FilterType = "New" | "Rerun" | "Fes" | "Collab" | "All";

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

export default function FutureBannerScreen() {
  const scrollRef = useRef<{ resetScroll: () => void }>(null);
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, "background");
  const cardBackground = useThemeColor({}, "background");

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

  // Fetch banner data from the backend API
  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, "banners");
      const querySnapshot: any = await getDocs(usersRef);
      const currentDateTime = new Date();
      const bannersData = querySnapshot.docs
        .map((doc: any) => {
          const data = doc.data();
          return {
            id: doc.id,
            startDate: data.startDate,
            endDate: data.endDate,
            type: data.type,
            characters: data.characters || [],
          };
        })
        .filter((banner: any) => {
          let endDate = new Date(banner.endDate);
          return !isNaN(endDate.getTime()) && endDate > currentDateTime;
        });

      setBanners(bannersData);
    } catch (err) {
      setError("Failed to load banners");
    } finally {
      setLoading(false);
    }
  }, []);

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
      result = result.filter((banner) =>
        banner.characters.some((char) =>
          char.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
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
          const maxRarityA = Math.max(
            ...a.characters.map((char) => char.rarity)
          );
          const maxRarityB = Math.max(
            ...b.characters.map((char) => char.rarity)
          );
          return maxRarityB - maxRarityA;
        });
        break;
    }

    return result;
  }, [banners, searchQuery, filterType, sortOption]);

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
                {character.name}
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.tags}>
              <CustomChip
                bgColor={typeColor[character.atkType]?.background}
                icon={typeColor[character.atkType]?.icon}
                label={character.atkType}
              />
              <CustomChip
                bgColor={typeColor[character.defType]?.background}
                icon={typeColor[character.defType]?.icon}
                label={character.defType}
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
          <ActivityIndicator size="large" color="#00F5FF" />
          <ThemedText type="default" style={styles.loadingText}>
            Loading banners...
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
          <View>
            <ThemedText type="title" style={styles.mainTitle}>
              Future Banners
            </ThemedText>
            <View style={styles.sectionAccent} />
            <ThemedText type="default" style={styles.subtitle}>
              Upcoming character releases
            </ThemedText>
          </View>
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
        </ThemedView>

        {error ? (
          <View style={styles.errorContainer}>
            <ThemedText type="default" style={styles.errorText}>
              {error}
            </ThemedText>
            <Button
              mode="contained"
              onPress={fetchBanners}
              buttonColor="#00F5FF"
              textColor="#0F172A"
            >
              Try Again
            </Button>
          </View>
        ) : (
          <>
            {/* Enhanced Search and Filter Section */}
            <ThemedView style={styles.filterSection}>
              <Searchbar
                placeholder="Search characters..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
                inputStyle={styles.searchInput}
                iconColor="#00F5FF"
              />

              <ThemedView style={styles.filterRow}>
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
                      Sort
                    </Button>
                  }
                  contentStyle={styles.menuContent}
                >
                  <Menu.Item
                    onPress={() => {
                      setSortOption("date-asc");
                      setShowSortMenu(false);
                    }}
                    title="Earliest First"
                  />
                  <Menu.Item
                    onPress={() => {
                      setSortOption("date-desc");
                      setShowSortMenu(false);
                    }}
                    title="Latest First"
                  />
                </Menu>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.filterChips}
                  contentContainerStyle={styles.filterChipsContent}
                >
                  {(
                    ["All", "New", "Rerun", "Fes", "Collab"] as FilterType[]
                  ).map((type) => (
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
                      {type}
                    </Chip>
                  ))}
                </ScrollView>
              </ThemedView>
            </ThemedView>

            {/* Enhanced Banners List */}
            <View style={styles.bannerList}>
              {filteredAndSortedBanners.map((banner, index) => {
                const daysUntil = getDaysUntil(banner.startDate);
                const isActive =
                  daysUntil <= 0 && getDaysUntil(banner.endDate) > 0;

                return (
                  <AnimatedCard
                    key={banner.id}
                    style={styles.bannerCardWrapper}
                  >
                    <Card
                      style={[
                        styles.bannerCard,
                        { backgroundColor: cardBackground },
                        isActive && styles.activeBannerCard,
                      ]}
                    >
                      <View style={styles.bannerHeader}>
                        <View style={styles.bannerInfo}>
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

                      <List.Accordion
                        title={banner.characters[0].name + " Banner"}
                        description={`${formatDate(
                          banner.startDate
                        )} - ${formatDate(banner.endDate)}`}
                        titleNumberOfLines={2}
                        expanded={expandedBanner === banner.id}
                        onPress={() =>
                          setExpandedBanner(
                            expandedBanner === banner.id ? null : banner.id
                          )
                        }
                        style={styles.accordionHeader}
                        titleStyle={styles.accordionTitle}
                        descriptionStyle={styles.accordionDescription}
                        left={(props) => (
                          <View style={styles.accordionImageContainer}>
                            <Image
                              source={{ uri: banner.characters[0].image }}
                              style={styles.accordionCharacterImage}
                            />
                          </View>
                        )}
                        right={(props) => (
                          <View
                            style={[
                              styles.accordionArrow,
                              props.isExpanded && styles.accordionArrowExpanded,
                            ]}
                          >
                            <ThemedText style={styles.accordionArrowText}>
                              ▼
                            </ThemedText>
                          </View>
                        )}
                      >
                        <View style={styles.charactersContainer}>
                          {banner.characters.map(renderCharacterCard)}
                        </View>
                      </List.Accordion>
                    </Card>
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
    backgroundColor: "#0F172A",
  },
  backgroundPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0F172A",
    opacity: 0.8,
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
    borderRadius: 12,
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
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 2,
  },
  sectionAccent: {
    width: 80,
    height: 3,
    backgroundColor: "#00F5FF",
    borderRadius: 2,
    shadowColor: "#00F5FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
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
    color: "#00F5FF",
  },
  filterSection: {
    marginBottom: 24,
    gap: 12,
  },
  searchBar: {
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderRadius: 12,
    elevation: 2,
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
    backgroundColor: "#1E293B",
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
    backgroundColor: "rgba(71, 85, 105, 0.3)",
    borderRadius: 20,
    height: 32,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  selectedFilterChip: {
    backgroundColor: "#00F5FF",
  },
  filterChipText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  selectedFilterChipText: {
    color: "#0F172A",
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
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.3)",
  },
  activeBannerCard: {
    borderColor: "#00F5FF",
    borderWidth: 2,
    shadowColor: "#00F5FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bannerHeader: {
    padding: 12,
    paddingBottom: 0,
  },
  bannerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bannerTypeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    height: 24, // Fixed height for consistency
    justifyContent: "center", // Center text vertically
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
    lineHeight: 16, // Ensure text is centered within fixed height
  },
  liveBadge: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    height: 24, // Match bannerTypeChip height
    justifyContent: "center",
  },
  liveBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 16, // Match bannerTypeText
  },
  countdownBadge: {
    backgroundColor: "rgba(0, 245, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    height: 24, // Match bannerTypeChip height
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#00F5FF",
  },
  countdownText: {
    color: "#00F5FF",
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 16, // Match bannerTypeText
  },
  accordionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  accordionHeader: {
    backgroundColor: "#0F172A",
  },
  accordionDescription: {
    color: "#94A3B8",
    fontSize: 12,
    backgroundColor: "#0F172A",
  },
  accordionImageContainer: {
    marginLeft: 8,
    marginRight: 12,
  },
  accordionCharacterImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(0, 245, 255, 0.3)",
  },
  accordionArrow: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    transform: [{ rotate: "0deg" }],
  },
  accordionArrowExpanded: {
    transform: [{ rotate: "180deg" }],
  },
  accordionArrowText: {
    color: "#94A3B8",
    fontSize: 12,
  },
  charactersContainer: {
    gap: 12,
    padding: 12,
    paddingLeft: 12,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
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
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.4)",
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
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(148, 163, 184, 0.3)",
  },
  limitedOverlay: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#F59E0B",
    borderRadius: 16,
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
    backgroundColor: "#EF4444",
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
