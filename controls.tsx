import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useJarvis } from "@/lib/jarvis-context";
import { useQuery } from "@tanstack/react-query";

interface CommandAction {
  id: string;
  label: string;
  icon: string;
  hindi: string;
  critical?: boolean;
}

interface CommandCategory {
  category: string;
  actions: CommandAction[];
}

function CommandButton({ action, onPress, isExecuting }: {
  action: CommandAction;
  onPress: (action: CommandAction) => void;
  isExecuting: boolean;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const isCritical = !!action.critical;

  return (
    <Animated.View style={[styles.commandButtonWrapper, animatedStyle]}>
      <Pressable
        style={[
          styles.commandButton,
          isCritical && styles.criticalButton,
        ]}
        onPress={() => onPress(action)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isExecuting}
      >
        {isExecuting ? (
          <ActivityIndicator size="small" color={Colors.dark.accent} />
        ) : (
          <MaterialIcons
            name={action.icon as any}
            size={22}
            color={isCritical ? Colors.dark.danger : Colors.dark.accent}
          />
        )}
        <Text style={[
          styles.commandLabel,
          isCritical && { color: Colors.dark.danger },
        ]}>
          {action.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function ControlsScreen() {
  const insets = useSafeAreaInsets();
  const { executeCommand, confirmCriticalAction, makeCall, shizukuStatus } = useJarvis();
  const [executingAction, setExecutingAction] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ success: boolean; action: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ visible: boolean; action: CommandAction | null }>({
    visible: false,
    action: null,
  });
  const [callModal, setCallModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const { data: commands } = useQuery<CommandCategory[]>({
    queryKey: ["/api/adb/commands"],
  });

  const handleCommand = useCallback(async (action: CommandAction) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setExecutingAction(action.id);
    setLastResult(null);
    const result = await executeCommand(action.id);

    if (result.requiresConfirmation) {
      setConfirmModal({ visible: true, action });
    } else {
      setLastResult({ success: result.success, action: action.id });
      if (Platform.OS !== "web") {
        if (result.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
      setTimeout(() => setLastResult(null), 3000);
    }
    setExecutingAction(null);
  }, [executeCommand]);

  const handleConfirm = useCallback(async () => {
    if (!confirmModal.action) return;
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setExecutingAction(confirmModal.action.id);
    const result = await confirmCriticalAction(confirmModal.action.id);
    setLastResult({ success: result.success, action: confirmModal.action.id });
    setConfirmModal({ visible: false, action: null });
    setExecutingAction(null);
    setTimeout(() => setLastResult(null), 3000);
  }, [confirmModal.action, confirmCriticalAction]);

  const handleCancel = useCallback(() => {
    setConfirmModal({ visible: false, action: null });
  }, []);

  const handleCall = useCallback(async () => {
    if (!phoneNumber.trim()) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await makeCall(phoneNumber.trim());
    setCallModal(false);
    setPhoneNumber("");
  }, [phoneNumber, makeCall]);

  const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
    const map: Record<string, keyof typeof Ionicons.glyphMap> = {
      "Flashlight": "flashlight-outline",
      "Wi-Fi": "wifi-outline",
      "Mobile Data": "cellular-outline",
      "Bluetooth": "bluetooth-outline",
      "Airplane Mode": "airplane-outline",
      "Power": "power-outline",
      "Telephony": "call-outline",
      "Media": "musical-notes-outline",
      "Camera & Audio": "camera-outline",
      "Navigation": "navigate-outline",
      "Volume": "volume-medium-outline",
    };
    return map[category] || "ellipse-outline";
  };

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <LinearGradient
        colors={["#080C14", "#0A1628", "#080C14"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <Text style={styles.title}>Command Center</Text>
        <View style={[
          styles.shizukuBadge,
          { backgroundColor: shizukuStatus.authorized ? Colors.dark.successDim : Colors.dark.warningDim },
        ]}>
          <Ionicons
            name={shizukuStatus.authorized ? "shield-checkmark" : "shield-outline"}
            size={12}
            color={shizukuStatus.authorized ? Colors.dark.success : Colors.dark.warning}
          />
          <Text style={[
            styles.shizukuText,
            { color: shizukuStatus.authorized ? Colors.dark.success : Colors.dark.warning },
          ]}>
            {shizukuStatus.authorized ? "Active" : "No Permission"}
          </Text>
        </View>
      </View>

      {lastResult && (
        <View style={[
          styles.resultBanner,
          { backgroundColor: lastResult.success ? Colors.dark.successDim : Colors.dark.dangerDim },
          { borderColor: lastResult.success ? Colors.dark.success + "40" : Colors.dark.danger + "40" },
        ]}>
          <Ionicons
            name={lastResult.success ? "checkmark-circle" : "close-circle"}
            size={16}
            color={lastResult.success ? Colors.dark.success : Colors.dark.danger}
          />
          <Text style={[
            styles.resultText,
            { color: lastResult.success ? Colors.dark.success : Colors.dark.danger },
          ]}>
            {lastResult.success
              ? `${lastResult.action.replace(/_/g, " ")} - Exit Code: 0`
              : `${lastResult.action.replace(/_/g, " ")} - Failed`}
          </Text>
        </View>
      )}

      {!shizukuStatus.authorized && (
        <View style={styles.permWarning}>
          <Ionicons name="warning-outline" size={14} color={Colors.dark.warning} />
          <Text style={styles.permWarningText}>
            Requesting Permission - Connect device via ADB
          </Text>
        </View>
      )}

      <Pressable
        style={styles.callButton}
        onPress={() => setCallModal(true)}
      >
        <Ionicons name="call" size={18} color={Colors.dark.success} />
        <Text style={styles.callButtonText}>Make a Call</Text>
      </Pressable>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {commands?.map((category, idx) => (
          <Animated.View
            key={category.category}
            entering={FadeIn.delay(idx * 50).duration(300)}
            style={styles.categorySection}
          >
            <View style={styles.categoryHeader}>
              <Ionicons
                name={getCategoryIcon(category.category)}
                size={16}
                color={Colors.dark.accent}
              />
              <Text style={styles.categoryTitle}>{category.category}</Text>
            </View>
            <View style={styles.commandGrid}>
              {category.actions.map((action) => (
                <CommandButton
                  key={action.id}
                  action={action}
                  onPress={handleCommand}
                  isExecuting={executingAction === action.id}
                />
              ))}
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      <Modal
        visible={confirmModal.visible}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={[Colors.dark.dangerDim, Colors.dark.surface]}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="warning" size={40} color={Colors.dark.warning} />
            <Text style={styles.modalTitle}>Pushti Chahiye</Text>
            <Text style={styles.modalMessage}>
              Kya aap iski pushti (confirm) karte hain?
            </Text>
            <Text style={styles.modalAction}>
              {confirmModal.action?.label}
            </Text>
            <View style={styles.modalButtons}>
              <Pressable style={styles.rejectButton} onPress={handleCancel}>
                <Ionicons name="close" size={20} color={Colors.dark.danger} />
                <Text style={[styles.modalButtonText, { color: Colors.dark.danger }]}>
                  Nahi / Reject
                </Text>
              </Pressable>
              <Pressable style={styles.approveButton} onPress={handleConfirm}>
                <Ionicons name="checkmark" size={20} color={Colors.dark.success} />
                <Text style={[styles.modalButtonText, { color: Colors.dark.success }]}>
                  Haan / Approve
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={callModal}
        transparent
        animationType="slide"
        onRequestClose={() => setCallModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { gap: 16 }]}>
            <Ionicons name="call" size={32} color={Colors.dark.success} />
            <Text style={styles.modalTitle}>Call Contact</Text>
            <TextInput
              style={styles.phoneInput}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Phone number"
              placeholderTextColor={Colors.dark.textMuted}
              keyboardType="phone-pad"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.rejectButton} onPress={() => { setCallModal(false); setPhoneNumber(""); }}>
                <Ionicons name="close" size={20} color={Colors.dark.danger} />
                <Text style={[styles.modalButtonText, { color: Colors.dark.danger }]}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.approveButton} onPress={handleCall}>
                <Ionicons name="call" size={20} color={Colors.dark.success} />
                <Text style={[styles.modalButtonText, { color: Colors.dark.success }]}>Call</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 20,
    color: Colors.dark.text,
    letterSpacing: 1,
  },
  shizukuBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  shizukuText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  resultBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  resultText: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 11,
    flex: 1,
  },
  permWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 20,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.dark.warningDim,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.warning + "30",
  },
  permWarningText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.dark.warning,
    flex: 1,
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.dark.successDim,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.success + "30",
  },
  callButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.dark.success,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  categoryTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  commandGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  commandButtonWrapper: {
    minWidth: 75,
  },
  commandButton: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    minWidth: 75,
  },
  criticalButton: {
    borderColor: Colors.dark.danger + "30",
    backgroundColor: Colors.dark.dangerDim,
  },
  commandLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.dark.text,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: "hidden",
  },
  modalTitle: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 18,
    color: Colors.dark.text,
  },
  modalMessage: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
  modalAction: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.dark.warning,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    width: "100%",
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    backgroundColor: Colors.dark.dangerDim,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.danger + "30",
  },
  approveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    backgroundColor: Colors.dark.successDim,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.success + "30",
  },
  modalButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  phoneInput: {
    width: "100%",
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "SpaceMono_400Regular",
    fontSize: 18,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    textAlign: "center",
  },
});
