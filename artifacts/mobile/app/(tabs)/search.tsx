import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { PostCard } from "@/components/PostCard";
import { api } from "@/lib/api";

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [searchText, setSearchText] = useState("");
  const [query, setQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["search", query],
    queryFn: () => api.posts.list({ search: query, limit: 30 }),
    enabled: query.length > 0,
  });

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: C.background }]}>
        <Text style={[styles.title, { color: C.text, fontFamily: "Inter_700Bold" }]}>
          Search
        </Text>
        <View style={[styles.searchBar, { backgroundColor: C.backgroundTertiary, borderColor: C.border }]}>
          <Feather name="search" size={16} color={C.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: C.text, fontFamily: "Inter_400Regular" }]}
            placeholder="Search posts, topics..."
            placeholderTextColor={C.textTertiary}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={() => setQuery(searchText.trim())}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => { setSearchText(""); setQuery(""); }} hitSlop={8}>
              <Feather name="x" size={16} color={C.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      {query.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="search" size={48} color={C.placeholder} />
          <Text style={[styles.emptyTitle, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>
            Find great stories
          </Text>
          <Text style={[styles.emptyText, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
            Search for topics, authors, or keywords
          </Text>
        </View>
      ) : isLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color={C.tint} />
        </View>
      ) : (
        <FlatList
          data={data?.posts || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          renderItem={({ item }) => <PostCard post={item} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="inbox" size={40} color={C.textTertiary} />
              <Text style={[styles.emptyText, { color: C.textSecondary, fontFamily: "Inter_500Medium" }]}>
                No results for "{query}"
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12, gap: 14 },
  title: { fontSize: 28, letterSpacing: -0.5 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15 },
  listContent: { padding: 16 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingTop: 80,
  },
  emptyTitle: { fontSize: 18 },
  emptyText: { fontSize: 14, textAlign: "center", paddingHorizontal: 40 },
});
