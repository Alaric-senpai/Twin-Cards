import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { NAV_THEME } from "@/lib/theme";

export const Container = ({children}: {children: React.ReactNode})=>{
    const { colorScheme } = useColorScheme();
    const backgroundColor = NAV_THEME[colorScheme ?? 'light'].colors.background;

    return (
        <SafeAreaProvider className="flex-1" style={{ backgroundColor }}>
            {children}  
        </SafeAreaProvider>
    )
}
