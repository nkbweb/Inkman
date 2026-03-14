import { Feather } from "@expo/vector-icons";
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

import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/colors";

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await signIn(email.trim(), password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.dismissAll();
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: C.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Feather name="x" size={22} color={C.textSecondary} />
        </Pressable>

        <View style={styles.header}>
          <View style={[styles.logoCircle, { backgroundColor: C.tint }]}>
            <Feather name="book-open" size={28} color="#fff" />
          </View>
          <Text style={[styles.title, { color: C.text, fontFamily: "Inter_700Bold" }]}>
            Welcome back
          </Text>
          <Text style={[styles.subtitle, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
            Sign in to continue reading and writing
          </Text>
        </View>

        {error && (
          <View style={[styles.errorBox, { backgroundColor: isDark ? "#2D1515" : "#FEF2F2" }]}>
            <Feather name="alert-circle" size={14} color={C.danger} />
            <Text style={[styles.errorText, { color: C.danger, fontFamily: "Inter_400Regular" }]}>
              {error}
            </Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: C.textSecondary, fontFamily: "Inter_500Medium" }]}>
              Email
            </Text>
            <View style={[styles.inputWrapper, { backgroundColor: C.backgroundTertiary, borderColor: C.border }]}>
              <Feather name="mail" size={16} color={C.textTertiary} />
              <TextInput
                style={[styles.input, { color: C.text, fontFamily: "Inter_400Regular" }]}
                placeholder="you@example.com"
                placeholderTextColor={C.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: C.textSecondary, fontFamily: "Inter_500Medium" }]}>
              Password
            </Text>
            <View style={[styles.inputWrapper, { backgroundColor: C.backgroundTertiary, borderColor: C.border }]}>
              <Feather name="lock" size={16} color={C.textTertiary} />
              <TextInput
                style={[styles.input, { color: C.text, fontFamily: "Inter_400Regular" }]}
                placeholder="Your password"
                placeholderTextColor={C.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={16} color={C.textTertiary} />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: C.tint, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.primaryBtnText, { fontFamily: "Inter_600SemiBold" }]}>
                Sign In
              </Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
            Don't have an account?
          </Text>
          <Pressable onPress={() => router.replace("/(auth)/register")}>
            <Text style={[styles.link, { color: C.tint, fontFamily: "Inter_600SemiBold" }]}>
              Sign Up
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 24 },
  closeBtn: {
    alignSelf: "flex-end",
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  header: { alignItems: "center", marginTop: 24, marginBottom: 36, gap: 12 },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: { fontSize: 28, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, textAlign: "center" },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: { fontSize: 13, flex: 1 },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: 15 },
  primaryBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#5B4FE9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: { color: "#fff", fontSize: 16 },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 32,
  },
  footerText: { fontSize: 14 },
  link: { fontSize: 14 },
});
