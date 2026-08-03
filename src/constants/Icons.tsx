import { FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

interface IconProps {
  color?: string;
  size?: number;
}

export const ListIcon = ({ color, size }: IconProps) => (
  <MaterialCommunityIcons
    name="clipboard-check"
    size={size ?? 24}
    color={color ?? "white"}
  />
);

export const PalletIcon = ({ color, size }: IconProps) => (
  <MaterialCommunityIcons
    name="shipping-pallet"
    size={size ?? 24}
    color={color ?? "white"}
  />
);

export const FilterIcon = ({ color, size }: IconProps) => (
  <MaterialCommunityIcons
    name="filter"
    size={size ?? 24}
    color={color ?? "white"}
  />
);

export const CloseIcon = ({ color, size }: IconProps) => (
  <MaterialCommunityIcons
    name="close"
    size={size ?? 24}
    color={color ?? "white"}
  />
);

export const ChevronDownIcon = ({ color, size }: IconProps) => (
  <MaterialCommunityIcons
    name="chevron-down"
    size={size ?? 24}
    color={color ?? "white"}
  />
);

export const ChevronUpIcon = ({ color, size }: IconProps) => (
  <MaterialCommunityIcons
    name="chevron-up"
    size={size ?? 24}
    color={color ?? "white"}
  />
);

export const ChevronLeftIcon = ({ color, size }: IconProps) => (
  <MaterialCommunityIcons
    name="chevron-left"
    size={size ?? 24}
    color={color ?? "white"}
  />
);

export const ChevronRightIcon = ({ color, size }: IconProps) => (
  <MaterialCommunityIcons
    name="chevron-right"
    size={size ?? 24}
    color={color ?? "white"}
  />
);

export const UserIcon = ({ color, size }: IconProps) => (
  <MaterialCommunityIcons
    name="account"
    size={size ?? 24}
    color={color ?? "white"}
  />
);

export const HistoryIcon = ({ color, size }: IconProps) => (
  <MaterialCommunityIcons
    name="history"
    size={size ?? 24}
    color={color ?? "white"}
  />
);

export const LayerIcon = ({ color, size }: IconProps) => (
  <MaterialCommunityIcons
    name="layers-triple"
    size={size ?? 24}
    color={color ?? "white"}
  />
);

export const CircleInfoIcon = ({ color, size }: IconProps) => (
  <MaterialCommunityIcons
    name="information"
    size={size ?? 24}
    color={color ?? "white"}
  />
);

export const PrintIcon = ({ color, size }: IconProps) => (
  <MaterialCommunityIcons
    name="printer"
    size={size ?? 24}
    color={color ?? "white"}
  />
);

export const QrCodeScan = ({ color, size }: IconProps) => (
  <MaterialCommunityIcons
    name="qrcode-scan"
    size={size ?? 24}
    color={color ?? "white"}
  />
);

export const ClockIcon = ({ color, size }: IconProps) => (
  <MaterialCommunityIcons
    name="clock"
    size={size ?? 24}
    color={color ?? "white"}
  />
);

export const BoxIcon = ({ color, size }: IconProps) => (
  <FontAwesome6 name="box" size={size ?? 24} color={color ?? "white"} />
);

export const WeightIcon = ({ color, size }: IconProps) => (
  <MaterialCommunityIcons
    name="weight-kilogram"
    size={size ?? 24}
    color={color ?? "white"}
  />
);

export const ConfirmIcon = ({ color, size }: IconProps) => (
  <MaterialCommunityIcons
    name="check"
    size={size ?? 24}
    color={color ?? "white"}
  />
);

export const QuestionIcon = ({ color, size }: IconProps) => (
  <FontAwesome6 name="question" size={size ?? 24} color={color ?? "white"} />
);

export const SearchIcon = ({ color, size }: IconProps) => (
  <MaterialCommunityIcons
    name="search-web"
    size={size ?? 24}
    color={color ?? "white"}
  />
);

export const LoadingIcon = ({ color, size }: IconProps) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animar = () => {
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start((completion) => {
        console.log(completion);
        if (completion.finished) {
          rotation.setValue(0);
          animar();
        }
      });
    };
    animar();
  }, []);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <MaterialCommunityIcons
        name={"loading"}
        size={size ?? 24}
        color={color ?? "white"}
      />
    </Animated.View>
  );
};
