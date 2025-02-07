import {
  StyleSheet,
  Image,
  View,
  ScrollView,
  RefreshControl,
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
    return styles.defaultBadge; // Optional default style
  };

  return (
    <View style={[styles.classBadge, getBadgeStyle()]}>
      <ThemedText type="small" style={styles.classText}>
        {classType.toUpperCase()}
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
  const [loading, setLoading] = useState<boolean>(true); // For handling loading state
  const [error, setError] = useState<string | null>(null); // For error state

  // Format helpers
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
          // Ensure the date is valid before comparison
          return !isNaN(endDate.getTime()) && endDate > currentDateTime;
        });

      // Set the banners data to state
      setBanners(bannersData);
      //setBanners(querySnapshot)
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

  // Fetch data on mount
  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // Filter and sort logic
  const filteredAndSortedBanners = useMemo(() => {
    let result = [...banners];

    // Apply search
    if (searchQuery) {
      result = result.filter((banner) =>
        banner.characters.some((char) =>
          char.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Apply type filter
    if (filterType !== "All") {
      result = result.filter((banner) => banner.type === filterType);
    }

    // Apply sorting
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

  //   // Character modal
  //   const CharacterModal = () => (
  //     <Portal>
  //       <Modal
  //         visible={!!selectedCharacter}
  //         onDismiss={() => setSelectedCharacter(null)}
  //         contentContainerStyle={[
  //           styles.modalContainer,
  //           { backgroundColor: cardBackground },
  //         ]}
  //       >
  //         {selectedCharacter && (
  //           <ScrollView>
  //             <Image source={selectedCharacter.image} style={styles.modalImage} />
  //             <ThemedText type="title">{selectedCharacter.name}</ThemedText>
  //             {selectedCharacter.isLimited && (
  //   <Chip style={[styles.limitedChip, styles.modalLimitedChip]} textStyle={styles.limitedChipText}>
  //     LIMITED TIME CHARACTER
  //   </Chip>
  // )}
  //             <ThemedText type="default" style={styles.rarityText}>
  //               {renderRarityStars(selectedCharacter.rarity)}
  //             </ThemedText>
  //             <Divider style={styles.modalDivider} />
  //             <ThemedText type="default" style={styles.description}>
  //               {selectedCharacter.description}
  //             </ThemedText>
  //             <ThemedText type="subtitle" style={styles.skillsTitle}>
  //               Skills
  //             </ThemedText>
  //             {selectedCharacter.skills?.map((skill, index) => (
  //               <View
  //                 key={index}
  //                 style={[
  //                   styles.skillContainer,
  //                   { backgroundColor: cardBackground },
  //                 ]}
  //               >
  //                 <ThemedText type="cardtitle" style={styles.skillName}>
  //                   {skill.name}
  //                 </ThemedText>
  //                 <ThemedText type="default">{skill.description}</ThemedText>
  //               </View>
  //             ))}
  //             <Button mode="contained" onPress={() => setSelectedCharacter(null)}>
  //               Close
  //             </Button>
  //           </ScrollView>
  //         )}
  //       </Modal>
  //     </Portal>
  //   );

  const renderCharacterCard = (character: Character) => (
    <Card
      style={[styles.characterCard, { backgroundColor: cardBackground }]}
      key={character.id}
      //onPress={() => setSelectedCharacter(character)}
    >
      <Card.Content style={styles.characterContent}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: character.image }}
            style={styles.characterImage}
          />
          {character.isLimited && (
            <Image
              source={require("@/assets/images/characters/limited_icon.png")}
              style={styles.limitedBadge}
            />
          )}
        </View>
        <View style={styles.characterInfo}>
          <ThemedView style={styles.characterHeader}>
            <ThemedText type="cardtitle" style={styles.characterName}>
              {character.name}
            </ThemedText>
            {character.isNew && <CustomChip label="New" />}
          </ThemedView>
          {character?.class && (
            <CharacterClassBadge classType={character.class} />
          )}
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
  );

  if (loading && !refreshing) {
    return (
      <Surface
        style={[styles.container, { paddingTop: insets.top }]}
        elevation={0}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
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
      <Surface
        style={[styles.container, { paddingTop: insets.top, backgroundColor }]}
        elevation={0}
      >
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Future Banners</ThemedText>
          <Button
            icon="refresh"
            mode="text"
            compact={true}
            onPress={onRefresh}
            loading={refreshing}
            disabled={refreshing}
            labelStyle={styles.refreshBtnLabel}
            contentStyle={styles.refreshBtnContent}
          >
            {""}
          </Button>
        </ThemedView>
        {error ? (
          <View style={styles.errorContainer}>
            <ThemedText type="default" style={styles.errorText}>
              {error}
            </ThemedText>
            <Button mode="contained" onPress={fetchBanners}>
              Try Again
            </Button>
          </View>
        ) : (
          <>
            {/* Search and Filter Section */}
            <ThemedView style={styles.filterSection}>
              <Searchbar
                placeholder="Search banners..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
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
                    >
                      Sort
                    </Button>
                  }
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
                >
                  {(
                    ["All", "New", "Rerun", "Fes", "Collab"] as FilterType[]
                  ).map((type) => (
                    <Chip
                      key={type}
                      selected={filterType === type}
                      onPress={() => setFilterType(type)}
                      style={styles.filterChip}
                    >
                      {type}
                    </Chip>
                  ))}
                </ScrollView>
              </ThemedView>
            </ThemedView>

            {/* Banners List */}
            <View style={styles.bannerList}>
              {filteredAndSortedBanners.map((banner) => (
                <Card
                  style={[
                    styles.bannerCard,
                    { backgroundColor: cardBackground },
                  ]}
                  key={banner.id}
                >
                  <List.Accordion
                    title={
                      banner.characters[0].name +
                      " - " +
                      banner.type +
                      " Banner"
                    }
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
                    left={(props) => (
                      <Image
                        source={{ uri: banner.characters[0].image }}
                        style={styles.accordionCharacterImage}
                      />
                    )}
                  >
                    <View style={styles.charactersContainer}>
                      {banner.characters.map(renderCharacterCard)}
                    </View>
                  </List.Accordion>
                </Card>
              ))}
            </View>
          </>
        )}
        {/* <CharacterModal /> */}
      </Surface>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
    gap: 16,
  },
  errorText: {
    textAlign: "center",
    color: "#DC2626",
  },
  titleContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "space-between",
  },
  refreshBtnContent: {
    marginHorizontal: 8,
    borderRadius: 50,
    padding: 0,
    flexDirection: "row-reverse",
  },
  refreshBtnLabel: {
    margin: 0,
    marginHorizontal: 0,
  },
  filterSection: {
    marginBottom: 16,
    gap: 8,
  },
  searchBar: {
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterChips: {
    flexGrow: 1,
  },
  filterChip: {
    marginRight: 8,
  },
  bannerList: {
    gap: 16,
  },
  accordionCharacterImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    margin: "auto",
    marginLeft: 8,
  },
  bannerCard: {
    overflow: "hidden",
  },
  eventCard: {
    margin: 8,
    paddingLeft: 0,
  },
  eventDetails: {
    marginBottom: 8,
  },
  rewardsContainer: {
    marginTop: 8,
  },
  rewardsTitle: {
    marginBottom: 4,
  },
  reward: {
    marginLeft: 8,
  },
  charactersContainer: {
    padding: 8,
    gap: 8,
    paddingLeft: 0,
  },
  characterCard: {
    marginBottom: 8,
  },
  characterContent: {
    flexDirection: "row",
    gap: 12,
  },
  characterImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  characterInfo: {
    flex: 1,
    justifyContent: "center",
  },
  characterHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  characterName: {
    flex: 1,
  },
  classBadge: {
    backgroundColor: "#2D3748",
    paddingHorizontal: 10,
    paddingVertical: 0,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  strikerBadge: {
    backgroundColor: "red",
  },
  specialBadge: {
    backgroundColor: "#007BFF",
  },
  defaultBadge: {
    backgroundColor: "gray", // Optional default color
  },
  classText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  statusChips: {
    flexDirection: "row",
    gap: 4,
  },
  //   limited
  limitedChip: {
    backgroundColor: "#FFFFFF",
  },
  limitedChipText: {
    color: "white",
    fontSize: 10,
  },
  modalLimitedChip: {
    alignSelf: "flex-start",
    marginTop: 8,
    marginBottom: 12,
  },
  imageContainer: {
    position: "relative",
  },
  limitedBadge: {
    position: "absolute",
    top: 60,
    left: -4,
    backgroundColor: "#FFB74D",
    borderRadius: 12,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fff",
  },
  limitedIcon: {
    fontSize: 12,
    color: "#fff",
  },
  //   rarity
  rarityText: {
    color: "#FFD700",
    marginBottom: 4,
  },
  tags: {
    flexDirection: "row",
    marginTop: 4,
    gap: 8,
  },
  atkTypeChip: {
    backgroundColor: "#e0e0e0",
  },
  defTypeChip: {
    backgroundColor: "#e0e0e0",
  },
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: "80%",
  },
  modalImage: {
    width: 160,
    height: 160,
    borderRadius: 12,
    marginBottom: 16,
    alignSelf: "center",
  },
  modalDivider: {
    marginVertical: 16,
  },
  description: {
    marginBottom: 16,
  },
  skillsTitle: {
    marginBottom: 12,
  },
  skillContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  skillName: {
    marginBottom: 8,
  },
});
