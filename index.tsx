import React, { useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  withSpring,
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useJarvis } from "@/lib/jarvis-context";

function WaveBar({ index, isSpeaking }: { index: number; isSpeaking: boolean }) {
  const height = useSharedValue(8);

  useEffect(() => {
    if (isSpeaking) {
      height.value = withRepeat(
        withSequence(
          withTiming(20 + Math.random() * 30, {
            duration: 200 + index * 50,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(5 + Math.random() * 10, {
            duration: 200 + index * 50,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        true
      );
    } else {
      height.value = withSpring(8, { damping: 15 });
    }
  }, [isSpeaking]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: 3,
          borderRadius: 2,
          backgroundColor: Colors.dark.accent,
          marginHorizontal: 1.5,
        },
        animatedStyle,
      ]}
    />
  );
}

function PulseRing({ isSpeaking }: { isSpeaking: boolean }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isSpeaking) {
      scale.value = withRepeat(
        withTiming(1.6, { duration: 1500, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 200 }),
          withTiming(0, { duration: 1300 })
        ),
        -1,
        false
      );
    } else {
      scale.value = withSpring(1);
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [isSpeaking]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: 140,
          height: 140,
          borderRadius: 70,
          borderWidth: 2,
          borderColor: Colors.dark.accent,
        },
        animatedStyle,
      ]}
    />
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const {
    deviceStatus,
    batteryInfo,
    shizukuStatus,
    isSpeaking,
    lastSpoken,
    refreshStatus,
    refreshBattery,
    refreshShizuku,
    repeatLast,
    commandLog,
  } = useJarvis();

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    refreshStatus();
    refreshBattery();
    refreshShizuku();
  }, []);

  const handleRepeat = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    repeatLast();
  }, [repeatLast]);

  const handleRefresh = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await Promise.all([refreshStatus(), refreshBattery(), refreshShizuku()]);
  }, [refreshStatus, refreshBattery, refreshShizuku]);

  const batteryColor =
    batteryInfo.level > 50 ? Colors.dark.success :
    batteryInfo.level > 20 ? Colors.dark.warning :
    Colors.dark.danger;

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <LinearGradient
        colors={["#080C14", "#0A1628", "#080C14"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>J.A.R.V.I.S</Text>
          <Text style={styles.subtitle}>Android System Controller</Text>
        </View>

        <View style={styles.voiceSection}>
          <PulseRing isSpeaking={isSpeaking} />
          <View style={styles.voiceCircle}>
            <LinearGradient
              colors={[
                isSpeaking ? "rgba(0,212,255,0.2)" : "rgba(0,212,255,0.05)",
                isSpeaking ? "rgba(0,212,255,0.05)" : "rgba(0,212,255,0.01)",
              ]}
              style={styles.voiceGradient}
            />
            <View style={styles.waveContainer}>
              {Array.from({ length: 20 }).map((_, i) => (
                <WaveBar key={i} index={i} isSpeaking={isSpeaking} />
              ))}
            </View>
          </View>
          {lastSpoken ? (
            <Pressable onPress={handleRepeat} style={styles.lastSpokenContainer}>
              <Ionicons name="refresh" size={14} color={Colors.dark.textSecondary} />
              <Text style={styles.lastSpokenText} numberOfLines={2}>
                {lastSpoken}
              </Text>
            </Pressable>
          ) : (
            <Text style={styles.voiceHint}>Voice responses will appear here</Text>
          )}
        </View>

        <View style={styles.statusGrid}>
          <View style={[
            styles.statusCard,
            { borderColor: shizukuStatus.authorized ? Colors.dark.success + "40" : Colors.dark.warning + "40" },
          ]}>
            <LinearGradient
              colors={[
                shizukuStatus.authorized ? Colors.dark.successDim : Colors.dark.warningDim,
                "transparent",
              ]}
              style={styles.cardGradient}
            />
            <Ionicons
              name={shizukuStatus.authorized ? "shield-checkmark" : "shield-outline"}
              size={22}
              color={shizukuStatus.authorized ? Colors.dark.success : Colors.dark.warning}
            />
            <Text style={styles.statusLabel}>Shizuku</Text>
            <Text style={[
              styles.statusValue,
              { color: shizukuStatus.authorized ? Colors.dark.success : Colors.dark.warning },
            ]}>
              {shizukuStatus.authorized ? "Authorized" : shizukuStatus.adbAvailable ? "No Device" : "No ADB"}
            </Text>
            {shizukuStatus.devices.length > 0 && (
              <Text style={styles.deviceId} numberOfLines={1}>
                {shizukuStatus.devices[0]}
              </Text>
            )}
          </View>

          <View style={[styles.statusCard, { borderColor: batteryColor + "40" }]}>
            <LinearGradient
              colors={[batteryInfo.level > 0 ? batteryColor + "15" : "transparent", "transparent"]}
              style={styles.cardGradient}
            />
            <Ionicons
              name={
                batteryInfo.charging ? "battery-charging" :
                batteryInfo.level > 80 ? "battery-full" :
                batteryInfo.level > 50 ? "battery-half" :
                "battery-dead"
              }
              size={24}
              color={batteryInfo.level > 0 ? batteryColor : Colors.dark.textMuted}
            />
            <Text style={styles.statusLabel}>Battery</Text>
            <Text style={[styles.statusValue, { color: batteryInfo.level > 0 ? batteryColor : Colors.dark.textMuted }]}>
              {batteryInfo.level > 0 ? `${batteryInfo.level}%` : "N/A"}
            </Text>
            {batteryInfo.charging && (
              <Text style={[styles.deviceId, { color: Colors.dark.success }]}>Charging</Text>
            )}
          </View>
        </View>

        <Pressable style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="sync-outline" size={16} color={Colors.dark.accent} />
          <Text style={styles.refreshText}>Refresh Status</Text>
        </Pressable>

        {!shizukuStatus.authorized && (
          <View style={styles.permissionBanner}>
            <LinearGradient
              colors={[Colors.dark.warningDim, "transparent"]}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="warning-outline" size={20} color={Colors.dark.warning} />
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>Shizuku Permission Required</Text>
              <Text style={styles.bannerText}>
                {!shizukuStatus.adbAvailable
                  ? "ADB is not available on this server. Connect a device via USB or wireless ADB."
                  : "No authorized device found. Connect your Android device via ADB to execute hardware commands."}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.logSection}>
          <Text style={styles.sectionTitle}>Activity Log</Text>
          {commandLog.length === 0 ? (
            <View style={styles.emptyLog}>
              <Ionicons name="terminal-outline" size={28} color={Colors.dark.textMuted} />
              <Text style={styles.emptyLogText}>No commands executed yet</Text>
            </View>
          ) : (
            commandLog.slice(0, 10).map((entry) => (
              <View key={entry.id} style={styles.logEntry}>
                <View style={[
                  styles.logDot,
                  { backgroundColor: entry.success ? Colors.dark.success : Colors.dark.danger },
                ]} />
                <View style={styles.logContent}>
                  <Text style={styles.logAction}>{entry.action.replace(/_/g, " ")}</Text>
                  <Text style={styles.logHindi} numberOfLines={1}>{entry.hindiResponse}</Text>
                </View>
                <View style={styles.logMeta}>
                  <Text style={[
                    styles.logExitCode,
                    { color: entry.exitCode === 0 ? Colors.dark.success : Colors.dark.danger },
                  ]}>
                    {entry.exitCode === 0 ? "OK" : `E${entry.exitCode}`}
                  </Text>
                  <Text style={styles.logTime}>
                    {new Date(entry.timestamp).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 24,
  },
  title: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 28,
    color: Colors.dark.accent,
    letterSpacing: 6,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginTop: 4,
    letterSpacing: 1,
  },
  voiceSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  voiceCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: Colors.dark.accent + "30",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  voiceGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 70,
  },
  waveContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
  },
  lastSpokenContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    gap: 6,
    maxWidth: "90%",
  },
  lastSpokenText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.dark.textSecondary,
    flexShrink: 1,
  },
  voiceHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 14,
  },
  statusGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statusCard: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    gap: 6,
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  statusLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.dark.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  statusValue: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 14,
  },
  deviceId: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: Colors.dark.textMuted,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    marginBottom: 16,
    backgroundColor: Colors.dark.accentDim,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.accent + "20",
  },
  refreshText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.dark.accent,
  },
  permissionBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    marginBottom: 20,
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.warning + "30",
    overflow: "hidden",
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.dark.warning,
    marginBottom: 4,
  },
  bannerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
  },
  logSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.dark.text,
    marginBottom: 12,
  },
  emptyLog: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyLogText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.dark.textMuted,
  },
  logEntry: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.dark.surface,
    borderRadius: 10,
    marginBottom: 6,
    gap: 10,
  },
  logDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  logContent: {
    flex: 1,
  },
  logAction: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.dark.text,
    textTransform: "capitalize" as const,
  },
  logHindi: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  logMeta: {
    alignItems: "flex-end",
    gap: 2,
  },
  logExitCode: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 10,
  },
  logTime: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: Colors.dark.textMuted,
  },
});
