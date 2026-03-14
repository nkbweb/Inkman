import { Feather } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { api } from "@/lib/api";

const CATEGORIES = ["Technology", "Design", "Business", "Science", "Culture", "Travel", "Other"];

export default function WriteScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (published: boolean) =>
      api.posts.create({
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt.trim() || undefined,
        cover_image_url: coverImageUrl.trim() || undefined,
        category: category || undefined,
        published,
      }),
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["my-posts"] });
      router.replace({ pathname: "/post/[id]", params: { id: post.id } });
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const canSubmit = title.trim().length > 0 && content.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: C.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { paddingTop: topPadding + 12, borderBottomColor: C.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="x" size={22} color={C.textSecondary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: C.text, fontFamily: "Inter_700Bold" }]}>
          New Post
        </Text>
        <View style={styles.headerActions}>
          <Pressable
            style={({ pressed }) => [
              styles.draftBtn,
              { borderColor: C.border, opacity: pressed || !canSubmit ? 0.6 : 1 },
            ]}
            onPress={() => canSubmit && createMutation.mutate(false)}
            disabled={!canSubmit || createMutation.isPending}
          >
            <Text style={[styles.draftBtnText, { color: C.textSecondary, fontFamily: "Inter_500Medium" }]}>
              Draft
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.publishBtn,
              { backgroundColor: C.tint, opacity: pressed || !canSubmit ? 0.7 : 1 },
            ]}
            onPress={() => canSubmit && createMutation.mutate(true)}
            disabled={!canSubmit || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[styles.publishBtnText, { fontFamily: "Inter_600SemiBold" }]}>
                Publish
              </Text>
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View style={[styles.errorBox, { backgroundColor: isDark ? "#2D1515" : "#FEF2F2" }]}>
            <Feather name="alert-circle" size={14} color={C.danger} />
            <Text style={[styles.errorText, { color: C.danger, fontFamily: "Inter_400Regular" }]}>
              {error}
            </Text>
          </View>
        )}

        <TextInput
          style={[styles.titleInput, { color: C.text, fontFamily: "Inter_700Bold" }]}
          placeholder="Post title..."
          placeholderTextColor={C.placeholder}
          value={title}
          onChangeText={setTitle}
          multiline
        />

        <View style={[styles.metaRow, { borderColor: C.border }]}>
          <Pressable
            style={[styles.metaField, { borderRightColor: C.border }]}
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
          >
            <Feather name="tag" size={14} color={C.textTertiary} />
            <Text
              style={[
                styles.metaFieldText,
                { color: category ? C.text : C.textTertiary, fontFamily: "Inter_400Regular" },
              ]}
            >
              {category || "Category"}
            </Text>
            <Feather name="chevron-down" size={14} color={C.textTertiary} />
          </Pressable>
        </View>

        {showCategoryPicker && (
          <View style={[styles.categoryPicker, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                style={[
                  styles.categoryOption,
                  {
                    backgroundColor: category === cat ? C.tag : "transparent",
                    borderBottomColor: C.borderLight,
                  },
                ]}
                onPress={() => {
                  setCategory(category === cat ? null : cat);
                  setShowCategoryPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.categoryOptionText,
                    {
                      color: category === cat ? C.tagText : C.text,
                      fontFamily: category === cat ? "Inter_600SemiBold" : "Inter_400Regular",
                    },
                  ]}
                >
                  {cat}
                </Text>
                {category === cat && <Feather name="check" size={14} color={C.tagText} />}
              </Pressable>
            ))}
          </View>
        )}

        <TextInput
          style={[styles.excerptInput, { color: C.text, borderColor: C.border, fontFamily: "Inter_400Regular" }]}
          placeholder="Short description (optional)..."
          placeholderTextColor={C.textTertiary}
          value={excerpt}
          onChangeText={setExcerpt}
          multiline
        />

        <TextInput
          style={[styles.coverInput, { color: C.text, borderColor: C.border, fontFamily: "Inter_400Regular" }]}
          placeholder="Cover image URL (optional)..."
          placeholderTextColor={C.textTertiary}
          value={coverImageUrl}
          onChangeText={setCoverImageUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={[styles.divider, { backgroundColor: C.border }]} />

        <TextInput
          style={[styles.contentInput, { color: C.text, fontFamily: "Inter_400Regular" }]}
          placeholder="Write your story here..."
          placeholderTextColor={C.textTertiary}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { padding: 4 },
  headerTitle: { fontSize: 16 },
  headerActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  draftBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  draftBtnText: { fontSize: 13 },
  publishBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 72,
    alignItems: "center",
  },
  publishBtnText: { color: "#fff", fontSize: 13 },
  form: { padding: 20, gap: 16 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
  },
  errorText: { fontSize: 13, flex: 1 },
  titleInput: { fontSize: 26, letterSpacing: -0.5, lineHeight: 34, minHeight: 60 },
  metaRow: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  metaField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRightWidth: 0,
  },
  metaFieldText: { flex: 1, fontSize: 14 },
  categoryPicker: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: -8,
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  categoryOptionText: { fontSize: 14 },
  excerptInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    minHeight: 56,
    lineHeight: 20,
  },
  coverInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
  },
  divider: { height: StyleSheet.hairlineWidth },
  contentInput: {
    fontSize: 16,
    lineHeight: 28,
    minHeight: 300,
  },
});
