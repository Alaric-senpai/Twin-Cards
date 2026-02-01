import * as React from 'react';
import { View, Modal, Pressable, ScrollView, Dimensions } from 'react-native';
import { Text } from '@/components/ui/text';
import { useColorScheme } from 'nativewind';
import { X } from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
}

export function BottomSheet({
    visible,
    onClose,
    title,
    description,
    children,
}: BottomSheetProps) {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <Pressable
                className="flex-1 bg-black/60 items-center justify-center p-6"
                onPress={onClose}
            >
                <Pressable
                    onPress={(e) => e.stopPropagation()}
                    className={`w-full max-w-md rounded-2xl ${
                        isDark ? 'bg-slate-800' : 'bg-white'
                    } border border-border overflow-hidden`}
                    style={{ maxHeight: SCREEN_HEIGHT * 0.7 }}
                >
                    {/* Header */}
                    <View className="px-5 pt-5 pb-3 border-b border-border flex-row items-center justify-between">
                        <View className="flex-1 pr-3">
                            <Text className="text-lg font-bold text-foreground">{title}</Text>
                            {description && (
                                <Text className="text-xs text-muted-foreground mt-1">
                                    {description}
                                </Text>
                            )}
                        </View>
                        <Pressable
                            onPress={onClose}
                            className="w-8 h-8 rounded-full items-center justify-center"
                            style={{
                                backgroundColor: isDark
                                    ? 'rgba(255, 255, 255, 0.1)'
                                    : 'rgba(0, 0, 0, 0.05)',
                            }}
                        >
                            <X size={18} color={isDark ? '#F1F5F9' : '#0F172A'} />
                        </Pressable>
                    </View>

                    {/* Scrollable Content */}
                    <ScrollView
                        className="px-5 py-3"
                        showsVerticalScrollIndicator={true}
                        nestedScrollEnabled={true}
                    >
                        {children}
                    </ScrollView>
                </Pressable>
            </Pressable>
        </Modal>
    );
}
