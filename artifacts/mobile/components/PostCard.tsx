import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import Colors from "@/constants/colors";
import { Post } from "@/lib/api";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getInitials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

interface PostCardProps {
  post: Post;
  onLike?: (id: string) => void;
}

export function PostCard({ post, onLike }: PostCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const C = isDark ? Colors.dark : Colors.light;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: C.cardBackground,
          borderColor: C.border,
          opacity: pressed ? 0.95 : 1,
        },
      ]}
      onPress={() => router.push({ pathname: "/post/[id]", params: { id: post.id } })}
    >
      {post.cover_image_url && (
        <Image source={{ uri: post.cover_image_url }} style={styles.coverImage} />
      )}

      <View style={styles.body}>
        {post.category && (
          <View style={[styles.categoryTag, { backgroundColor: C.tag }]}>
            <Text style={[styles.categoryText, { color: C.tagText, fontFamily: "Inter_600SemiBold" }]}>
              {post.category}
            </Text>
          </View>
        )}

        <Text
          style={[styles.title, { color: C.text, fontFamily: "Inter_700Bold" }]}
          numberOfLines={2}
        >
          {post.title}
        </Text>

        {post.excerpt && (
          <Text
            style={[styles.excerpt, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}
            numberOfLines={2}
          >
            {post.excerpt}
          </Text>
        )}

        <View style={styles.footer}>
          <View style={styles.authorRow}>
            <View style={[styles.avatar, { backgroundColor: C.tint }]}>
              <Text style={[styles.avatarText, { fontFamily: "Inter_600SemiBold" }]}>
                {getInitials(post.author.username)}
              </Text>
            </View>
            <View>
              <Text style={[styles.authorName, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>
                {post.author.username}
              </Text>
              <Text style={[styles.date, { color: C.textTertiary, fontFamily: "Inter_400Regular" }]}>
                {formatDate(post.created_at)}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              style={styles.actionBtn}
              onPress={(e) => { e.stopPropagation(); onLike?.(post.id); }}
              hitSlop={8}
            >
              <Feather
                name="heart"
                size={14}
                color={post.is_liked ? "#EF4444" : C.textTertiary}
              />
              <Text style={[styles.actionCount, { color: post.is_liked ? "#EF4444" : C.textTertiary, fontFamily: "Inter_400Regular" }]}>
                {post.likes_count}
              </Text>
            </Pressable>
            <View style={styles.actionBtn}>
              <Feather name="message-circle" size={14} color={C.textTertiary} />
              <Text style={[styles.actionCount, { color: C.textTertiary, fontFamily: "Inter_400Regular" }]}>
                {post.comments_count}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 16,
  },
  coverImage: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  body: { padding: 16, gap: 8 },
  categoryTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  title: { fontSize: 17, lineHeight: 24, letterSpacing: -0.3 },
  excerpt: { fontSize: 14, lineHeight: 20 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 11 },
  authorName: { fontSize: 13 },
  date: { fontSize: 11 },
  actions: { flexDirection: "row", gap: 12 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  actionCount: { fontSize: 13 },
});
