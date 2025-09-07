import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import GameCard from "./components/GameCard";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { height: WINDOW_HEIGHT } = Dimensions.get("window");
const AUTO_ADVANCE_SECONDS = 30;

type GameItem = {
  id: string;
  title: string;
  url: string;
};

const SAMPLE_GAMES: GameItem[] = [
  // Replace these URLs with your hosted game index.html URLs
  { id: "quiz", title: "Quick Quiz", url: "https://html5games.sfo3.cdn.digitaloceanspaces.com/2048/index.html" },
  { id: "snake", title: "Classic Snake", url: "https://html5games.sfo3.cdn.digitaloceanspaces.com/snake/index.html" },
  { id: "clicker", title: "Clicker Fun", url: "https://html5games.sfo3.cdn.digitaloceanspaces.com/clicker/index.html" }
];

export default function App() {
  const listRef = useRef<FlatList<GameItem>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(AUTO_ADVANCE_SECONDS);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadFavorites();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          advanceToNext();
          return AUTO_ADVANCE_SECONDS;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex]);

  const advanceToNext = () => {
    const next = (currentIndex + 1) % SAMPLE_GAMES.length;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setCurrentIndex(next);
    setSecondsLeft(AUTO_ADVANCE_SECONDS);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const idx = viewableItems[0].index ?? 0;
      setCurrentIndex(idx);
      setSecondsLeft(AUTO_ADVANCE_SECONDS);
    }
  }).current;

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  async function loadFavorites() {
    try {
      const raw = await AsyncStorage.getItem("favorites_v1");
      if (raw) setFavorites(JSON.parse(raw));
    } catch (e) {
      console.warn("Failed to load favorites", e);
    }
  }

  async function toggleFavorite(id: string) {
    const next = { ...favorites, [id]: !favorites[id] };
    setFavorites(next);
    try {
      await AsyncStorage.setItem("favorites_v1", JSON.stringify(next));
    } catch (e) {
      console.warn("Failed to save favorite", e);
    }
  }

  const renderItem = ({ item, index }: { item: GameItem; index: number }) => (
    <View style={{ height: WINDOW_HEIGHT, width: "100%" }}>
      <GameCard
        id={item.id}
        title={item.title}
        url={item.url}
        onFavorite={() => toggleFavorite(item.id)}
        isFavorite={!!favorites[item.id]}
        secondsLeft={secondsLeft}
        onRequestAdvance={advanceToNext}
      />
    </View>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <FlatList
          ref={listRef}
          data={SAMPLE_GAMES}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          pagingEnabled
          decelerationRate={Platform.OS === 'ios' ? "fast" : 0.98}
          snapToInterval={WINDOW_HEIGHT}
          snapToAlignment="start"
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewConfigRef.current}
          style={{ flex: 1 }}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
        />
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {currentIndex + 1} / {SAMPLE_GAMES.length} • Auto next in {secondsLeft}s
          </Text>
          <TouchableOpacity
            style={styles.footerBtn}
            onPress={() => Alert.alert("Info", "Host your games on Firebase Hosting / Netlify and replace example URLs.")}
          >
            <Text style={styles.footerBtnText}>Host Help</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  footer: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: { color: "#fff", fontSize: 14, opacity: 0.95 },
  footerBtn: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  footerBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
});
