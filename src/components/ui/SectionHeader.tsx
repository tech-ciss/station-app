import { Text, View } from "react-native";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  className?: string;
};

/**
 * En-tête de section standard avec titre et sous-titre optionnel.
 * Remplace les <View className="gap-1"> <Text>title</Text><Text>subtitle</Text></View>
 * répétés dans chaque écran.
 */
export function SectionHeader({ title, subtitle, className = "" }: SectionHeaderProps) {
  return (
    <View className={`gap-1 ${className}`}>
      <Text className="text-headingMedium font-bold text-yely-text">{title}</Text>
      {subtitle ? (
        <Text className="text-body text-yely-muted">{subtitle}</Text>
      ) : null}
    </View>
  );
}
