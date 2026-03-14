import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
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

function getInitials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"published" | "drafts">("published");

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.profile.get(),
    enabled: !!session,
  });

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ["my-posts"],
    queryFn: () => api.profile.myPosts(),
    enabled: !!session,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.posts.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const handleDeletePost = (post: Post) => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(post.id),
        },
      ]
    );
  };

  if (!session) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: C.background }]}>
        <View style={[styles.authIcon, { backgroundColor: C.backgroundTertiary }]}>
          <Feather name="user" size={32} color={C.textTertiary} />
        </View>
        <Text style={[styles.authTitle, { color: C.text, fontFamily: "Inter_700Bold" }]}>
          Sign in to your account
        </Text>
        <Text style={[styles.authSubtitle, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
          Write posts, like articles, and join the conversation
        </Text>
        <View style={styles.authActions}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: C.tint, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={[styles.primaryBtnText, { fontFamily: "Inter_600SemiBold" }]}>
              Sign In
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryBtn,
              { borderColor: C.border, opacity: pressed ? 0.75 : 1 },
            ]}
            onPress={() => router.push("/(auth)/register")}
          >
            <Text style={[styles.secondaryBtnText, { color: C.text, fontFamily: "Inter_500Medium" }]}>
              Create Account
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const allPosts = postsData?.posts || [];
  const publishedPosts = allPosts.filter((p) => p.published);
  const draftPosts = allPosts.filter((p) => !p.published);
  const displayedPosts = activeTab === "published" ? publishedPosts : draftPosts;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <FlatList
        data={displayedPosts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        ListHeaderComponent={
          <View>
            <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
              <Pressable
                style={({ pressed }) => [styles.signOutBtn, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => {
                  Alert.alert("Sign Out", "Are you sure?", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Sign Out", style: "destructive", onPress: signOut },
                  ]);
                }}
              >
                <Feather name="log-out" size={18} color={C.textSecondary} />
              </Pressable>
            </View>

            {profileLoading ? (
              <View style={[styles.centered, { paddingVertical: 40 }]}>
                <ActivityIndicator color={C.tint} />
              </View>
            ) : (
              <View style={styles.profileSection}>
                <View style={[styles.bigAvatar, { backgroundColor: C.tint }]}>
                  <Text style={[styles.bigAvatarText, { fontFamily: "Inter_700Bold" }]}>
                    {getInitials(profile?.username || "?")}
                  </Text>
                </View>
                <Text style={[styles.username, { color: C.text, fontFamily: "Inter_700Bold" }]}>
                  {profile?.username}
                </Text>
                <Text style={[styles.email, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
                  {profile?.email}
                </Text>
                {profile?.bio && (
                  <Text style={[styles.bio, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
                    {profile.bio}
                  </Text>
                )}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: C.text, fontFamily: "Inter_700Bold" }]}>
                      {profile?.posts_count || 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: C.textTertiary, fontFamily: "Inter_400Regular" }]}>
                      Posts
                    </Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: C.border }]} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: C.text, fontFamily: "Inter_700Bold" }]}>
                      {allPosts.reduce((sum, p) => sum + p.likes_count, 0)}
                    </Text>
                    <Text style={[styles.statLabel, { color: C.textTertiary, fontFamily: "Inter_400Regular" }]}>
                      Likes
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.writeNewBtn,
                    { backgroundColor: C.tint, opacity: pressed ? 0.85 : 1 },
                  ]}
                  onPress={() => router.push("/write")}
                >
                  <Feather name="plus" size={16} color="#fff" />
                  <Text style={[styles.writeNewBtnText, { fontFamily: "Inter_600SemiBold" }]}>
                    New Post
                  </Text>
                </Pressable>
              </View>
            )}

            <View style={[styles.tabBar, { borderBottomColor: C.border }]}>
              {(["published", "drafts"] as const).map((tab) => (
                <Pressable
                  key={tab}
                  style={[
                    styles.tabItem,
                    activeTab === tab && { borderBottomColor: C.tint, borderBottomWidth: 2 },
                  ]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color: activeTab === tab ? C.tint : C.textSecondary,
                        fontFamily: activeTab === tab ? "Inter_600SemiBold" : "Inter_400Regular",
                      },
                    ]}
                  >
                    {tab === "published" ? `Published (${publishedPosts.length})` : `Drafts (${draftPosts.length})`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.postWithActions}>
            <PostCard post={item} />
            <View style={[styles.postActions, { borderColor: C.border }]}>
              <Pressable
                style={({ pressed }) => [styles.postActionBtn, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => router.push({ pathname: "/edit/[id]", params: { id: item.id } })}
              >
                <Feather name="edit-2" size={14} color={C.textSecondary} />
                <Text style={[styles.postActionText, { color: C.textSecondary, fontFamily: "Inter_500Medium" }]}>
                  Edit
                </Text>
              </Pressable>
              <View style={[styles.postActionDivider, { backgroundColor: C.border }]} />
              <Pressable
                style={({ pressed }) => [styles.postActionBtn, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => handleDeletePost(item)}
              >
                <Feather name="trash-2" size={14} color={C.danger} />
                <Text style={[styles.postActionText, { color: C.danger, fontFamily: "Inter_500Medium" }]}>
                  Delete
                </Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !postsLoading ? (
            <View style={[styles.centered, { paddingTop: 40 }]}>
              <Feather name="file-text" size={40} color={C.textTertiary} />
              <Text style={[styles.emptyText, { color: C.textSecondary, fontFamily: "Inter_500Medium" }]}>
                {activeTab === "published" ? "No published posts yet" : "No drafts"}
              </Text>
              <Text style={[styles.emptySubtext, { color: C.textTertiary, fontFamily: "Inter_400Regular" }]}>
                {activeTab === "published" ? "Write and publish your first story" : "Save drafts to finish them later"}
              </Text>
            </View>
          ) : (
            <View style={[styles.centered, { paddingTop: 40 }]}>
              <ActivityIndicator color={C.tint} />
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  header: { paddingHorizontal: 20, flexDirection: "row", justifyContent: "flex-end", marginBottom: 8 },
  signOutBtn: { padding: 8 },
  profileSection: { alignItems: "center", paddingHorizontal: 24, paddingBottom: 24, gap: 8 },
  bigAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  bigAvatarText: { color: "#fff", fontSize: 28 },
  username: { fontSize: 22, letterSpacing: -0.3 },
  email: { fontSize: 14 },
  bio: { fontSize: 14, textAlign: "center", lineHeight: 20, paddingHorizontal: 20 },
  statsRow: { flexDirection: "row", gap: 24, alignItems: "center", marginTop: 8 },
  statItem: { alignItems: "center", gap: 2 },
  statValue: { fontSize: 20, letterSpacing: -0.5 },
  statLabel: { fontSize: 12 },
  statDivider: { width: 1, height: 32 },
  writeNewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  writeNewBtnText: { color: "#fff", fontSize: 14 },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabText: { fontSize: 14 },
  postWithActions: { paddingHorizontal: 16 },
  postActions: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: -8,
    marginBottom: 16,
  },
  postActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  postActionText: { fontSize: 13 },
  postActionDivider: { width: 1 },
  authIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  authTitle: { fontSize: 22, textAlign: "center" },
  authSubtitle: { fontSize: 14, textAlign: "center", paddingHorizontal: 32, lineHeight: 20 },
  authActions: { width: "100%", paddingHorizontal: 32, gap: 12, marginTop: 8 },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#5B4FE9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: { color: "#fff", fontSize: 16 },
  secondaryBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  secondaryBtnText: { fontSize: 16 },
  emptyText: { fontSize: 16 },
  emptySubtext: { fontSize: 13, textAlign: "center", paddingHorizontal: 24 },
});
