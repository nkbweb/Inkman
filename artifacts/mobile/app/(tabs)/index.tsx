import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { PostCard } from "@/components/PostCard";
import { useAuth } from "@/context/AuthContext";
import { api, Post } from "@/lib/api";

const CATEGORIES = ["All", "Technology", "Design", "Business", "Science", "Culture", "Travel"];

export default function FeedScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState("All");

  const { data, isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ["posts", selectedCategory],
    queryFn: () =>
      api.posts.list({
        limit: 20,
        category: selectedCategory === "All" ? undefined : selectedCategory,
      }),
  });

  const likeMutation = useMutation({
    mutationFn: (id: string) => api.posts.like(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["posts", selectedCategory] });
      const prev = queryClient.getQueryData<{ posts: Post[] }>(["posts", selectedCategory]);
      queryClient.setQueryData(["posts", selectedCategory], (old: any) => ({
        ...old,
        posts: old?.posts?.map((p: Post) =>
          p.id === id
            ? { ...p, is_liked: !p.is_liked, likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1 }
            : p
        ),
      }));
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(["posts", selectedCategory], ctx.prev);
      }
    },
  });

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: C.background, borderBottomColor: C.border }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={[styles.logoMini, { backgroundColor: C.tint }]}>
              <Feather name="book-open" size={14} color="#fff" />
            </View>
            <Text style={[styles.headerTitle, { color: C.text, fontFamily: "Inter_700Bold" }]}>
              Inkwell
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.writeBtn,
              { backgroundColor: C.tint, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => {
              if (!session) {
                router.push("/(auth)/login");
              } else {
                router.push("/write");
              }
            }}
          >
            <Feather name="edit-2" size={14} color="#fff" />
            <Text style={[styles.writeBtnText, { fontFamily: "Inter_600SemiBold" }]}>Write</Text>
          </Pressable>
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => {
            const active = item === selectedCategory;
            return (
              <Pressable
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: active ? C.tint : C.backgroundTertiary,
                    borderColor: active ? C.tint : C.border,
                  },
                ]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    {
                      color: active ? "#fff" : C.textSecondary,
                      fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular",
                    },
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={C.tint} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Feather name="wifi-off" size={36} color={C.textTertiary} />
          <Text style={[styles.emptyText, { color: C.textSecondary, fontFamily: "Inter_500Medium" }]}>
            Failed to load posts
          </Text>
          <Pressable onPress={() => refetch()} style={[styles.retryBtn, { borderColor: C.border }]}>
            <Text style={[{ color: C.tint, fontFamily: "Inter_500Medium", fontSize: 14 }]}>
              Try again
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={data?.posts || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onLike={session ? (id) => likeMutation.mutate(id) : undefined}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={C.tint}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Feather name="inbox" size={40} color={C.textTertiary} />
              <Text style={[styles.emptyText, { color: C.textSecondary, fontFamily: "Inter_500Medium" }]}>
                No posts yet
              </Text>
              <Text style={[styles.emptySubtext, { color: C.textTertiary, fontFamily: "Inter_400Regular" }]}>
                Be the first to share something
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
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoMini: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 22, letterSpacing: -0.5 },
  writeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  writeBtnText: { color: "#fff", fontSize: 13 },
  categoryList: { paddingHorizontal: 20, gap: 8 },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryPillText: { fontSize: 13 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 80 },
  emptyText: { fontSize: 16 },
  emptySubtext: { fontSize: 14 },
  retryBtn: { borderWidth: 1, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  listContent: { padding: 16 },
});
