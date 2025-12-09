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

export default function TermsOfServiceScreen() {
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
      title: '1. Acceptation des conditions',
      content: `En utilisant ReMindly, vous acceptez d'être lié par ces conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.`,
    },
    {
      title: '2. Description du service',
      content: `ReMindly est une application mobile de gestion de rappels et d'événements qui permet aux utilisateurs de :
• Créer et gérer des événements
• Recevoir des rappels et notifications
• Partager des événements avec d'autres utilisateurs
• Organiser des événements en groupes
• Accéder à des fonctionnalités Premium (abonnement requis)`,
    },
    {
      title: '3. Compte utilisateur',
      content: `Pour utiliser ReMindly, vous devez :
• Créer un compte avec une adresse email valide
• Fournir des informations exactes et à jour
• Maintenir la sécurité de votre compte
• Être responsable de toutes les activités sous votre compte
• Notifier immédiatement toute utilisation non autorisée

Vous devez avoir au moins 13 ans pour utiliser ReMindly.`,
    },
    {
      title: '4. Utilisation acceptable',
      content: `Vous vous engagez à :
• Utiliser le service conformément à la loi
• Ne pas utiliser le service à des fins illégales
• Ne pas tenter d'accéder à des comptes d'autres utilisateurs
• Ne pas perturber ou endommager le service
• Respecter les droits de propriété intellectuelle
• Ne pas transmettre de virus ou code malveillant`,
    },
    {
      title: '5. Contenu utilisateur',
      content: `Vous conservez tous les droits sur le contenu que vous créez dans ReMindly. En utilisant le service, vous nous accordez une licence pour :
• Stocker et traiter votre contenu
• Afficher votre contenu dans l'application
• Partager votre contenu avec les utilisateurs que vous autorisez

Vous êtes responsable du contenu que vous créez et partagez.`,
    },
    {
      title: '6. Abonnements Premium',
      content: `Les fonctionnalités Premium sont disponibles via un abonnement payant :
• Les abonnements sont facturés mensuellement ou annuellement
• Les prix peuvent être modifiés avec un préavis de 30 jours
• Les abonnements se renouvellent automatiquement
• Vous pouvez annuler à tout moment dans les paramètres
• Aucun remboursement pour la période en cours après annulation`,
    },
    {
      title: '7. Propriété intellectuelle',
      content: `ReMindly et son contenu (logos, design, code) sont protégés par les lois sur la propriété intellectuelle. Vous ne pouvez pas :
• Copier, modifier ou distribuer notre contenu
• Utiliser nos marques sans autorisation
• Extraire ou utiliser nos données à des fins commerciales`,
    },
    {
      title: '8. Limitation de responsabilité',
      content: `ReMindly est fourni "tel quel". Nous ne garantissons pas :
• Que le service sera ininterrompu ou sans erreur
• Que les résultats répondront à vos attentes
• La correction de défauts ou erreurs

Dans la mesure permise par la loi, notre responsabilité est limitée au montant que vous avez payé pour le service au cours des 12 derniers mois.`,
    },
    {
      title: '9. Résiliation',
      content: `Nous pouvons suspendre ou résilier votre compte si :
• Vous violez ces conditions d'utilisation
• Vous utilisez le service de manière frauduleuse
• Nous devons le faire pour des raisons légales

Vous pouvez supprimer votre compte à tout moment depuis les paramètres.`,
    },
    {
      title: '10. Modifications des conditions',
      content: `Nous pouvons modifier ces conditions à tout moment. Les modifications importantes vous seront notifiées par email ou via l'application. La poursuite de l'utilisation du service après modification constitue votre acceptation des nouvelles conditions.`,
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
          <Text style={styles.headerTitle}>Conditions d'utilisation</Text>
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
              Veuillez lire attentivement ces conditions d'utilisation avant d'utiliser ReMindly.
              En utilisant notre service, vous acceptez d'être lié par ces conditions.
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
                Pour toute question concernant ces conditions, contactez-nous à :
              </Text>
              <Text style={styles.contactEmail}>legal@remindly.app</Text>
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

