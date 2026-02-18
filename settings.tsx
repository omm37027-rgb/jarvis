import React, { useCallback } from "react";
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
import Colors from "@/constants/colors";
import { useJarvis } from "@/lib/jarvis-context";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { deviceStatus, shizukuStatus, speak, refreshShizuku } = useJarvis();

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const handleTestVoice = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    speak("Namaste sir, main JARVIS hoon, aapki seva mein hazir hoon");
  }, [speak]);

  const handleRefreshShizuku = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await refreshShizuku();
    if (shizukuStatus.authorized) {
      speak("Ji sir, Shizuku authorized hai, sab ready hai");
    } else {
      speak("Sir, Shizuku permission nahi mili, device connect karein");
    }
  }, [refreshShizuku, shizukuStatus.authorized, speak]);

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
          <Text style={styles.title}>Configuration</Text>
          <Text style={styles.subtitle}>Shizuku & Voice Settings</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark-outline" size={18} color={Colors.dark.accent} />
            <Text style={styles.sectionTitle}>Shizuku Status</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Authorization</Text>
              <View style={styles.statusBadge}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: shizukuStatus.authorized ? Colors.dark.success : Colors.dark.danger },
                ]} />
                <Text style={[
                  styles.infoValue,
                  { color: shizukuStatus.authorized ? Colors.dark.success : Colors.dark.danger },
                ]}>
                  {shizukuStatus.authorized ? "Granted" : "Not Granted"}
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ADB Available</Text>
              <Text style={[
                styles.infoValue,
                { color: shizukuStatus.adbAvailable ? Colors.dark.success : Colors.dark.danger },
              ]}>
                {shizukuStatus.adbAvailable ? "Yes" : "No"}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Connected Devices</Text>
              <Text style={styles.infoValue}>{shizukuStatus.deviceCount}</Text>
            </View>
            {shizukuStatus.devices.length > 0 && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Device ID</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {shizukuStatus.devices[0]}
                  </Text>
                </View>
              </>
            )}

            <Pressable style={styles.refreshBtn} onPress={handleRefreshShizuku}>
              <Ionicons name="sync-outline" size={16} color={Colors.dark.accent} />
              <Text style={styles.refreshBtnText}>Check Shizuku Status</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="volume-high-outline" size={18} color={Colors.dark.accent} />
            <Text style={styles.sectionTitle}>Voice Settings</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Language</Text>
              <Text style={styles.infoValue}>Hindi (hi-IN)</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Engine</Text>
              <Text style={styles.infoValue}>expo-speech</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Speed</Text>
              <Text style={styles.infoValue}>0.9x</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Confirmation</Text>
              <Text style={styles.infoValue}>Exit Code 0 Only</Text>
            </View>

            <Pressable style={styles.testButton} onPress={handleTestVoice}>
              <Ionicons name="mic-outline" size={18} color={Colors.dark.accent} />
              <Text style={styles.testButtonText}>Test Voice Output</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.dark.accent} />
            <Text style={styles.sectionTitle}>System Info</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Connection</Text>
              <View style={styles.statusBadge}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: deviceStatus.connected ? Colors.dark.success : Colors.dark.danger },
                ]} />
                <Text style={[
                  styles.infoValue,
                  { color: deviceStatus.connected ? Colors.dark.success : Colors.dark.danger },
                ]}>
                  {deviceStatus.connected ? "Connected" : "Disconnected"}
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Execution Mode</Text>
              <Text style={styles.infoValue}>ADB Shell (Shizuku)</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Devices</Text>
              <Text style={styles.infoValue}>
                {deviceStatus.devices.length > 0
                  ? deviceStatus.devices.join(", ")
                  : "None"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="code-slash-outline" size={18} color={Colors.dark.accent} />
            <Text style={styles.sectionTitle}>Command Verification</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.verifyItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.dark.success} />
              <Text style={styles.verifyText}>
                Success voice only plays when exit code = 0
              </Text>
            </View>
            <View style={styles.verifyItem}>
              <Ionicons name="close-circle" size={16} color={Colors.dark.danger} />
              <Text style={styles.verifyText}>
                Failed commands say: "Maaf kijiye sir..."
              </Text>
            </View>
            <View style={styles.verifyItem}>
              <Ionicons name="shield" size={16} color={Colors.dark.warning} />
              <Text style={styles.verifyText}>
                No Shizuku = "permission ke bina nahi kar sakta"
              </Text>
            </View>
            <View style={styles.verifyItem}>
              <Ionicons name="warning" size={16} color={Colors.dark.danger} />
              <Text style={styles.verifyText}>
                Critical actions (Reboot, Shutdown) require confirmation
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="terminal-outline" size={18} color={Colors.dark.accent} />
            <Text style={styles.sectionTitle}>Setup Guide</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.guideStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.guideText}>
                Enable Developer Options and USB Debugging on your Android device
              </Text>
            </View>
            <View style={styles.guideStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.guideText}>
                Connect device via USB or enable Wireless Debugging (Android 11+)
              </Text>
            </View>
            <View style={styles.guideStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.guideText}>
                Run "adb devices" on the server to verify connection
              </Text>
            </View>
            <View style={styles.guideStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.guideText}>
                Shizuku status will show "Granted" once device is authorized
              </Text>
            </View>
          </View>
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
    marginTop: 12,
    marginBottom: 24,
  },
  title: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 22,
    color: Colors.dark.text,
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  infoValue: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 13,
    color: Colors.dark.text,
    maxWidth: "50%",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
    paddingVertical: 12,
    backgroundColor: Colors.dark.accentDim,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.accent + "30",
  },
  refreshBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.dark.accent,
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
    paddingVertical: 12,
    backgroundColor: Colors.dark.accentDim,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.accent + "30",
  },
  testButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.dark.accent,
  },
  verifyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  verifyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.dark.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  guideStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.dark.accentDim,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 12,
    color: Colors.dark.accent,
  },
  guideText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.dark.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
});
