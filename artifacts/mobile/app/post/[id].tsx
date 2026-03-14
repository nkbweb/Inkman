import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { api, Comment, Post } from "@/lib/api";

function getInitials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");

  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ["post", id],
    queryFn: () => api.posts.get(id),
  });

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", id],
    queryFn: () => api.posts.comments.list(id),
  });

  const likeMutation = useMutation({
    mutationFn: () => api.posts.like(id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["post", id] });
      const prev = queryClient.getQueryData<Post>(["post", id]);
      queryClient.setQueryData(["post", id], (old: Post | undefined) =>
        old
          ? {
              ...old,
              is_liked: !old.is_liked,
              likes_count: old.is_liked ? old.likes_count - 1 : old.likes_count + 1,
            }
          : old
      );
      return { prev };
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["post", id], ctx.prev);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => api.posts.comments.create(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
      queryClient.invalidateQueries({ queryKey: ["post", id] });
      setCommentText("");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => api.comments.delete(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
    },
  });

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  if (postLoading) {
    return (
      <View style={[styles.flex, styles.centered, { backgroundColor: C.background }]}>
        <ActivityIndicator color={C.tint} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.flex, styles.centered, { backgroundColor: C.background }]}>
        <Feather name="alert-circle" size={32} color={C.textTertiary} />
        <Text style={[{ color: C.text, fontFamily: "Inter_500Medium" }]}>Post not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[{ color: C.tint, fontFamily: "Inter_500Medium" }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const CommentItem = ({ item }: { item: Comment }) => (
    <View style={[styles.commentItem, { borderBottomColor: C.borderLight }]}>
      <View style={[styles.commentAvatar, { backgroundColor: C.tint }]}>
        <Text style={[styles.commentAvatarText, { fontFamily: "Inter_600SemiBold" }]}>
          {getInitials(item.author.username)}
        </Text>
      </View>
      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <Text style={[styles.commentAuthor, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>
            {item.author.username}
          </Text>
          <Text style={[styles.commentDate, { color: C.textTertiary, fontFamily: "Inter_400Regular" }]}>
            {formatShortDate(item.created_at)}
          </Text>
        </View>
        <Text style={[styles.commentText, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
          {item.content}
        </Text>
      </View>
      {session?.user.id === item.author.id && (
        <Pressable
          onPress={() => deleteCommentMutation.mutate(item.id)}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Feather name="trash-2" size={14} color={C.danger} />
        </Pressable>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: C.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <FlatList
        data={comments || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        ListHeaderComponent={
          <View>
            <View style={[styles.navBar, { paddingTop: topPadding + 8, borderBottomColor: C.borderLight }]}>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Feather name="arrow-left" size={22} color={C.text} />
              </Pressable>
              <View style={styles.navActions}>
                {session && (
                  <Pressable
                    style={({ pressed }) => [styles.likeBtn, { opacity: pressed ? 0.7 : 1 }]}
                    onPress={() => likeMutation.mutate()}
                  >
                    <Feather
                      name="heart"
                      size={20}
                      color={post.is_liked ? "#EF4444" : C.textSecondary}
                    />
                  </Pressable>
                )}
              </View>
            </View>

            <ScrollView scrollEnabled={false}>
              <View style={styles.articleHeader}>
                {post.category && (
                  <View style={[styles.categoryTag, { backgroundColor: C.tag }]}>
                    <Text style={[styles.categoryText, { color: C.tagText, fontFamily: "Inter_600SemiBold" }]}>
                      {post.category}
                    </Text>
                  </View>
                )}
                <Text style={[styles.articleTitle, { color: C.text, fontFamily: "Inter_700Bold" }]}>
                  {post.title}
                </Text>

                <View style={styles.articleMeta}>
                  <View style={[styles.authorAvatar, { backgroundColor: C.tint }]}>
                    <Text style={[styles.authorAvatarText, { fontFamily: "Inter_700Bold" }]}>
                      {getInitials(post.author.username)}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.authorName, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>
                      {post.author.username}
                    </Text>
                    <Text style={[styles.articleDate, { color: C.textTertiary, fontFamily: "Inter_400Regular" }]}>
                      {formatDate(post.created_at)}
                    </Text>
                  </View>
                  <View style={styles.metaStats}>
                    <View style={styles.metaStat}>
                      <Feather name="heart" size={13} color={post.is_liked ? "#EF4444" : C.textTertiary} />
                      <Text style={[styles.metaStatText, { color: C.textTertiary, fontFamily: "Inter_400Regular" }]}>
                        {post.likes_count}
                      </Text>
                    </View>
                    <View style={styles.metaStat}>
                      <Feather name="message-circle" size={13} color={C.textTertiary} />
                      <Text style={[styles.metaStatText, { color: C.textTertiary, fontFamily: "Inter_400Regular" }]}>
                        {post.comments_count}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: C.border }]} />

              <View style={styles.articleBody}>
                <Text style={[styles.articleContent, { color: C.text, fontFamily: "Inter_400Regular" }]}>
                  {post.content}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: C.border }]} />

              <View style={styles.commentsSection}>
                <Text style={[styles.commentsTitle, { color: C.text, fontFamily: "Inter_700Bold" }]}>
                  Comments ({post.comments_count})
                </Text>
              </View>
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => <CommentItem item={item} />}
        ListEmptyComponent={
          !commentsLoading ? (
            <View style={[styles.emptyComments]}>
              <Text style={[styles.emptyCommentsText, { color: C.textTertiary, fontFamily: "Inter_400Regular" }]}>
                No comments yet. Be the first!
              </Text>
            </View>
          ) : null
        }
      />

      {session ? (
        <View
          style={[
            styles.commentInput,
            {
              backgroundColor: C.backgroundSecondary,
              borderTopColor: C.border,
              paddingBottom: insets.bottom + 8,
            },
          ]}
        >
          <TextInput
            style={[
              styles.commentTextInput,
              {
                backgroundColor: C.backgroundTertiary,
                color: C.text,
                borderColor: C.border,
                fontFamily: "Inter_400Regular",
              },
            ]}
            placeholder="Add a comment..."
            placeholderTextColor={C.textTertiary}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: commentText.trim() ? C.tint : C.backgroundTertiary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={() => {
              if (commentText.trim()) {
                commentMutation.mutate(commentText.trim());
              }
            }}
            disabled={!commentText.trim() || commentMutation.isPending}
          >
            {commentMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="send" size={16} color={commentText.trim() ? "#fff" : C.textTertiary} />
            )}
          </Pressable>
        </View>
      ) : (
        <View
          style={[
            styles.signInBanner,
            {
              backgroundColor: C.backgroundSecondary,
              borderTopColor: C.border,
              paddingBottom: insets.bottom + 8,
            },
          ]}
        >
          <Text style={[styles.signInText, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
            Sign in to like and comment
          </Text>
          <Pressable
            style={({ pressed }) => [styles.signInBtn, { backgroundColor: C.tint, opacity: pressed ? 0.85 : 1 }]}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={[styles.signInBtnText, { fontFamily: "Inter_600SemiBold" }]}>Sign In</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { alignItems: "center", justifyContent: "center", gap: 12 },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4 },
  navActions: { flexDirection: "row", gap: 8 },
  likeBtn: { padding: 4 },
  articleHeader: { padding: 20, gap: 12 },
  categoryTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  articleTitle: { fontSize: 26, lineHeight: 34, letterSpacing: -0.5 },
  articleMeta: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  authorAvatarText: { color: "#fff", fontSize: 13 },
  authorName: { fontSize: 14 },
  articleDate: { fontSize: 12 },
  metaStats: { flexDirection: "row", gap: 10, marginLeft: "auto" as any },
  metaStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaStatText: { fontSize: 13 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 20 },
  articleBody: { padding: 20 },
  articleContent: { fontSize: 16, lineHeight: 28, letterSpacing: 0.1 },
  commentsSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  commentsTitle: { fontSize: 18, letterSpacing: -0.3 },
  commentItem: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  commentAvatarText: { color: "#fff", fontSize: 11 },
  commentBody: { flex: 1, gap: 2 },
  commentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  commentAuthor: { fontSize: 13 },
  commentDate: { fontSize: 11 },
  commentText: { fontSize: 14, lineHeight: 20 },
  emptyComments: { paddingHorizontal: 20, paddingVertical: 24 },
  emptyCommentsText: { fontSize: 14, textAlign: "center" },
  commentInput: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  commentTextInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  signInBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  signInText: { fontSize: 13 },
  signInBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  signInBtnText: { color: "#fff", fontSize: 13 },
});
