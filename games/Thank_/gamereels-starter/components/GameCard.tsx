import React, { useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";

type Props = {
  id: string;
  title: string;
  url: string;
  isFavorite: boolean;
  onFavorite: () => void;
  secondsLeft: number;
  onRequestAdvance: () => void;
};

export default function GameCard({ title, url, isFavorite, onFavorite, secondsLeft, onRequestAdvance }: Props) {
  const webRef = useRef<any>(null);

  const handleMessage = (event: any) => {
    const data = event.nativeEvent.data;
    try {
      const parsed = JSON.parse(data);
      if (parsed?.type === "GAME_OVER") {
        onRequestAdvance();
      }
    } catch (e) {
      // ignore non-json
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={(r) => (webRef.current = r)}
        source={{ uri: url }}
        style={styles.webview}
        onMessage={handleMessage}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="large" />
            <Text style={{ color: "#fff", marginTop: 8 }}>Loading game…</Text>
          </View>
        )}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
      />

      <View style={styles.overlayTop}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity style={styles.heartBtn} onPress={onFavorite}>
          <Text style={{ fontSize: 22 }}>{isFavorite ? "💖" : "🤍"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.overlayBottom}>
        <Text style={styles.timerText}>Auto next in {secondsLeft}s</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  webview: { flex: 1, backgroundColor: "#000" },
  overlayTop: {
    position: "absolute",
    top: 18,
    left: 14,
    right: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "700" },
  heartBtn: { padding: 6 },
  overlayBottom: {
    position: "absolute",
    bottom: 40,
    left: 14,
    right: 14,
    alignItems: "flex-start",
  },
  timerText: { color: "#fff", fontSize: 14, backgroundColor: "rgba(0,0,0,0.4)", padding: 8, borderRadius: 8 },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
});
