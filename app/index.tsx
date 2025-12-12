import LottieView from "lottie-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const gradientBall = require("../assets/gradient-ball.json");

const ANIMATION_COUNT = 50;

interface LottieItemProps {
  id: number;
}

function LottieItem({ id }: LottieItemProps) {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    console.log(`[Lottie ${id}] MOUNTED`);
    return () => {
      console.log(`[Lottie ${id}] UNMOUNTED - cleanup triggered`);
    };
  }, [id]);

  return (
    <View style={styles.lottieContainer}>
      <LottieView
        ref={animationRef}
        source={gradientBall}
        autoPlay
        loop
        style={styles.lottie}
      />
      <Text style={styles.lottieLabel}>#{id}</Text>
    </View>
  );
}

export default function Index() {
  const [showAnimations, setShowAnimations] = useState(false);
  const [mountCount, setMountCount] = useState(0);
  const [animationCount, setAnimationCount] = useState(ANIMATION_COUNT);
  const [stressTestRunning, setStressTestRunning] = useState(false);
  const stressTestRef = useRef<NodeJS.Timeout | null>(null);

  // Stress test loop
  useEffect(() => {
    if (stressTestRunning) {
      const runCycle = () => {
        setShowAnimations((prev) => {
          if (prev) {
            console.log("=== STRESS TEST: UNMOUNTING ===");
            return false;
          } else {
            console.log("=== STRESS TEST: MOUNTING ===");
            setMountCount((c) => c + 1);
            return true;
          }
        });
        stressTestRef.current = setTimeout(runCycle, 500);
      };
      runCycle();
    }

    return () => {
      if (stressTestRef.current) {
        clearTimeout(stressTestRef.current);
        stressTestRef.current = null;
      }
    };
  }, [stressTestRunning]);

  const handleToggle = useCallback(() => {
    if (stressTestRunning) return; // Disable manual toggle during stress test
    if (showAnimations) {
      console.log("=== UNMOUNTING ALL LOTTIE ANIMATIONS ===");
      setShowAnimations(false);
    } else {
      console.log("=== MOUNTING LOTTIE ANIMATIONS ===");
      setMountCount((c) => c + 1);
      setShowAnimations(true);
    }
  }, [showAnimations, stressTestRunning]);

  const handleRemount = useCallback(() => {
    if (stressTestRunning) return;
    console.log("=== REMOUNTING ALL ANIMATIONS (unmount then mount) ===");
    setShowAnimations(false);
    setTimeout(() => {
      setMountCount((c) => c + 1);
      setShowAnimations(true);
    }, 100);
  }, [stressTestRunning]);

  const handleStressTest = useCallback(() => {
    if (stressTestRunning) {
      console.log("=== STOPPING STRESS TEST ===");
      setStressTestRunning(false);
    } else {
      console.log("=== STARTING STRESS TEST ===");
      setStressTestRunning(true);
    }
  }, [stressTestRunning]);

  const incrementCount = useCallback(() => {
    setAnimationCount((c) => Math.min(c + 10, 200));
  }, []);

  const decrementCount = useCallback(() => {
    setAnimationCount((c) => Math.max(c - 10, 10));
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lottie Destruction Repro</Text>
        <Text style={styles.subtitle}>
          Mount cycle: {mountCount} | Animations: {animationCount}
        </Text>

        <View style={styles.countControls}>
          <Pressable style={styles.smallButton} onPress={decrementCount}>
            <Text style={styles.buttonText}>-10</Text>
          </Pressable>
          <Text style={styles.countText}>{animationCount} animations</Text>
          <Pressable style={styles.smallButton} onPress={incrementCount}>
            <Text style={styles.buttonText}>+10</Text>
          </Pressable>
        </View>

        <View style={styles.buttonRow}>
          <Pressable
            style={[
              styles.button,
              showAnimations ? styles.buttonDanger : styles.buttonPrimary,
            ]}
            onPress={handleToggle}
          >
            <Text style={styles.buttonText}>
              {showAnimations ? "Unmount All" : "Mount Animations"}
            </Text>
          </Pressable>

          {showAnimations && !stressTestRunning && (
            <Pressable
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleRemount}
            >
              <Text style={styles.buttonText}>Remount</Text>
            </Pressable>
          )}
        </View>

        <Pressable
          style={[
            styles.stressButton,
            stressTestRunning ? styles.buttonWarning : styles.buttonStress,
          ]}
          onPress={handleStressTest}
        >
          <Text style={styles.buttonText}>
            {stressTestRunning ? "Stop Stress Test" : "Start Stress Test"}
          </Text>
        </Pressable>

        <Text style={styles.instructions}>
          1. Tap &quot;Mount Animations&quot; to render {animationCount} Lottie
          views{"\n"}
          2. Tap &quot;Unmount All&quot; to destroy them{"\n"}
          3. Check console logs for mount/unmount events{"\n"}
          4. Use memory profiler to detect leaks{"\n"}
          5. Repeatedly mount/unmount to amplify any leak
        </Text>
      </View>

      {showAnimations && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.grid}>
            {Array.from({ length: animationCount }).map((_, index) => (
              <LottieItem key={`${mountCount}-${index}`} id={index + 1} />
            ))}
          </View>
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}

      {!showAnimations && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No Lottie animations mounted</Text>
          <Text style={styles.emptySubtext}>
            Tap &quot;Mount Animations&quot; to begin test
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Status:{" "}
          {stressTestRunning
            ? `🔄 Stress test running (cycle ${mountCount})`
            : showAnimations
            ? `${animationCount} animations active`
            : "Idle"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    marginBottom: 16,
  },
  countControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    gap: 12,
  },
  countText: {
    color: "#fff",
    fontSize: 16,
    minWidth: 120,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  stressButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#333",
  },
  buttonPrimary: {
    backgroundColor: "#2563eb",
  },
  buttonSecondary: {
    backgroundColor: "#6366f1",
  },
  buttonDanger: {
    backgroundColor: "#dc2626",
  },
  buttonStress: {
    backgroundColor: "#9333ea",
    marginBottom: 16,
  },
  buttonWarning: {
    backgroundColor: "#ea580c",
    marginBottom: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  instructions: {
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    justifyContent: "flex-start",
  },
  lottieContainer: {
    width: "25%",
    aspectRatio: 1,
    padding: 4,
  },
  lottie: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
  },
  lottieLabel: {
    position: "absolute",
    bottom: 8,
    left: 8,
    fontSize: 10,
    color: "#666",
  },
  bottomPadding: {
    height: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "#444",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#333",
  },
  footer: {
    padding: 16,
    backgroundColor: "#1a1a1a",
    borderTopWidth: 1,
    borderTopColor: "#333",
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#666",
  },
});
