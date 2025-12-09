import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HelpScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const toggleItem = (index: number) => {
    setExpandedItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const faqs = [
    {
      question: 'Comment créer un événement ?',
      answer:
        'Pour créer un événement, appuyez sur le bouton "+" en haut de l\'écran, remplissez les informations requises (titre, date, heure) et appuyez sur "Enregistrer".',
    },
    {
      question: 'Comment ajouter des rappels ?',
      answer:
        'Lors de la création ou de l\'édition d\'un événement, vous pouvez sélectionner plusieurs rappels (5 min, 15 min, 1 heure, etc.) qui vous seront envoyés avant l\'événement.',
    },
    {
      question: 'Comment partager un événement ?',
      answer:
        'Ouvrez un événement, appuyez sur "Partager" et choisissez de partager avec un utilisateur ou un groupe. Les membres recevront une notification.',
    },
    {
      question: 'Comment fonctionnent les groupes ?',
      answer:
        'Les groupes permettent de collaborer sur des événements. Créez un groupe, ajoutez des membres, puis assignez des événements au groupe pour que tous les membres soient notifiés.',
    },
    {
      question: 'Qu\'est-ce que Premium ?',
      answer:
        'Premium offre des fonctionnalités avancées : rappels illimités, rappels géolocalisés, coffre-fort sécurisé, assistant IA, et bien plus encore.',
    },
  ];

  const supportOptions = [
    {
      icon: 'mail-outline',
      label: 'Email',
      description: 'support@remindly.app',
      onPress: () => Linking.openURL('mailto:support@remindly.app'),
    },
    {
      icon: 'chatbubble-outline',
      label: 'Chat en direct',
      description: 'Disponible 24/7',
      onPress: () => {},
    },
    {
      icon: 'document-text-outline',
      label: 'Centre d\'aide',
      description: 'Documentation complète',
      onPress: () => {},
    },
  ];

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Aide & Support</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="help-circle" size={64} color="#007AFF" />
            </View>
            <Text style={styles.heroTitle}>Comment pouvons-nous vous aider ?</Text>
            <Text style={styles.heroSubtitle}>
              Trouvez des réponses rapides ou contactez notre équipe
            </Text>
          </View>

          {/* Support Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contactez-nous</Text>
            <View style={styles.supportGrid}>
              {supportOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.supportCard}
                  onPress={option.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.supportIcon}>
                    <Ionicons name={option.icon as any} size={28} color="#007AFF" />
                  </View>
                  <Text style={styles.supportLabel}>{option.label}</Text>
                  <Text style={styles.supportDescription}>{option.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* FAQ Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Questions fréquentes</Text>
            <View style={styles.faqContainer}>
              {faqs.map((faq, index) => {
                const isExpanded = expandedItems.includes(index);
                return (
                  <View key={index} style={styles.faqItem}>
                    <TouchableOpacity
                      style={styles.faqQuestion}
                      onPress={() => toggleItem(index)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.faqQuestionText}>{faq.question}</Text>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                    {isExpanded && (
                      <View style={styles.faqAnswer}>
                        <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Quick Links */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Liens utiles</Text>
            <View style={styles.linksContainer}>
              <TouchableOpacity style={styles.linkItem} activeOpacity={0.7}>
                <Ionicons name="document-text-outline" size={22} color="#007AFF" />
                <Text style={styles.linkText}>Guide de démarrage</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkItem} activeOpacity={0.7}>
                <Ionicons name="videocam-outline" size={22} color="#007AFF" />
                <Text style={styles.linkText}>Tutoriels vidéo</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkItem} activeOpacity={0.7}>
                <Ionicons name="people-outline" size={22} color="#007AFF" />
                <Text style={styles.linkText}>Communauté</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
  },
  heroIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  supportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  supportCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e7',
  },
  supportIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  supportLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
    textAlign: 'center',
  },
  supportDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  faqContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e5e7',
    overflow: 'hidden',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 12,
  },
  faqAnswer: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: '#f8f9fa',
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  linksContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e5e7',
    overflow: 'hidden',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  linkText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginLeft: 12,
  },
});

