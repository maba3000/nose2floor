import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme';

export interface AppDialogAction {
  label: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
}

interface AppDialogProps {
  visible: boolean;
  title: string;
  message: string;
  actions: AppDialogAction[];
  onRequestClose?: () => void;
}

export function AppDialog({ visible, title, message, actions, onRequestClose }: AppDialogProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text selectable={false} style={styles.title}>
            {title}
          </Text>
          <Text selectable={false} style={styles.message}>
            {message}
          </Text>

          <View style={styles.actions}>
            {actions.map((action) => {
              const isDanger = action.tone === 'danger';
              return (
                <Pressable
                  key={action.label}
                  style={[styles.actionButton, isDanger && styles.actionDanger]}
                  onPress={action.onPress}
                >
                  <Text
                    selectable={false}
                    style={[styles.actionLabel, isDanger && styles.actionDangerLabel]}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    card: {
      width: '100%',
      maxWidth: 420,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.card,
      padding: 14,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
    },
    message: {
      fontSize: 13,
      color: theme.textSubtle,
      marginTop: 6,
      lineHeight: 18,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 14,
      flexWrap: 'wrap',
    },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.borderStrong,
      backgroundColor: theme.cardSoft,
    },
    actionLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.text,
    },
    actionDanger: {
      borderColor: theme.dangerBorder,
      backgroundColor: theme.dangerBackground,
    },
    actionDangerLabel: {
      color: theme.dangerText,
    },
  });
