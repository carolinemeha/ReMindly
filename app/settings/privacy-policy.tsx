import { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyPolicyScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const sections = [
    {
      title: '1. Collecte des données',
      content: `Nous collectons les informations que vous nous fournissez directement lors de l'utilisation de notre application, notamment :
• Informations de compte (email, mot de passe)
• Données d'événements (titres, descriptions, dates, localisations)
• Préférences utilisateur (thèmes, notifications)
• Données de profil (photo, fuseau horaire)`,
    },
    {
      title: '2. Utilisation des données',
      content: `Vos données sont utilisées pour :
• Fournir et améliorer nos services
• Personnaliser votre expérience
• Envoyer des notifications et rappels
• Analyser l'utilisation de l'application (données anonymisées)
• Assurer la sécurité de votre compte`,
    },
    {
      title: '3. Partage des données',
      content: `Nous ne vendons jamais vos données personnelles. Nous pouvons partager vos données uniquement dans les cas suivants :
• Avec votre consentement explicite
• Pour respecter une obligation légale
• Avec nos prestataires de services (hébergement, analytics) sous contrat de confidentialité
• En cas de fusion ou acquisition (avec notification préalable)`,
    },
    {
      title: '4. Sécurité des données',
      content: `Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données :
• Chiffrement des données en transit (HTTPS/TLS)
• Chiffrement des données sensibles au repos
• Authentification sécurisée
• Accès restreint aux données personnelles
• Sauvegardes régulières`,
    },
    {
      title: '5. Vos droits',
      content: `Conformément au RGPD, vous disposez des droits suivants :
• Droit d'accès à vos données personnelles
• Droit de rectification
• Droit à l'effacement ("droit à l'oubli")
• Droit à la portabilité des données
• Droit d'opposition au traitement
• Droit de limitation du traitement

Pour exercer ces droits, contactez-nous à : privacy@remindly.app`,
    },
    {
      title: '6. Conservation des données',
      content: `Nous conservons vos données personnelles aussi longtemps que nécessaire pour :
• Fournir nos services
• Respecter nos obligations légales
• Résoudre les litiges
• Faire respecter nos accords

Lorsque vous supprimez votre compte, vos données sont supprimées dans un délai de 30 jours, sauf obligation légale de conservation.`,
    },
    {
      title: '7. Cookies et technologies similaires',
      content: `Notre application utilise des technologies similaires aux cookies pour :
• Mémoriser vos préférences
• Analyser l'utilisation de l'application
• Améliorer les performances

Vous pouvez gérer ces préférences dans les paramètres de l'application.`,
    },
    {
      title: '8. Modifications de la politique',
      content: `Nous pouvons modifier cette politique de confidentialité à tout moment. Les modifications importantes vous seront notifiées par email ou via l'application. La date de dernière mise à jour est indiquée en bas de cette page.`,
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
          <Text style={styles.headerTitle}>Politique de confidentialité</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.intro}>
            <Text style={styles.introText}>
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <Text style={styles.introDescription}>
              Chez ReMindly, nous prenons votre vie privée au sérieux. Cette politique explique
              comment nous collectons, utilisons et protégeons vos données personnelles.
            </Text>
          </View>

          {sections.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionContent}>{section.content}</Text>
            </View>
          ))}

          <View style={styles.contactBox}>
            <Ionicons name="mail-outline" size={24} color="#007AFF" />
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>Questions ?</Text>
              <Text style={styles.contactText}>
                Pour toute question concernant cette politique, contactez-nous à :
              </Text>
              <Text style={styles.contactEmail}>privacy@remindly.app</Text>
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
  intro: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e5e7',
  },
  introText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
    fontWeight: '500',
  },
  introDescription: {
    fontSize: 16,
    color: '#1a1a1a',
    lineHeight: 24,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e5e7',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
  },
  contactBox: {
    flexDirection: 'row',
    backgroundColor: '#E6F4FE',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    marginBottom: 40,
    gap: 16,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#007AFF',
    lineHeight: 20,
    marginBottom: 8,
  },
  contactEmail: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});

