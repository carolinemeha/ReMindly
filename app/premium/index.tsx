import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { premiumService } from '@/services/premium.service';

export default function PremiumScreen() {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkPremiumStatus();
  }, []);

  const checkPremiumStatus = async () => {
    try {
      const premium = await premiumService.isPremium();
      setIsPremium(premium);
    } catch (error) {
      console.error('Erreur lors de la vérification du statut Premium:', error);
    }
  };

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    setLoading(true);
    try {
      // Note: Intégrer avec Stripe, App Store, ou Play Store selon votre choix
      Alert.alert(
        'Abonnement Premium',
        `Fonctionnalité d'abonnement à implémenter avec votre système de paiement (Stripe, App Store, Play Store)`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: 'infinite',
      title: 'Rappels illimités',
      description: 'Créez autant de rappels que vous le souhaitez',
    },
    {
      icon: 'location',
      title: 'Rappels géolocalisés',
      description: 'Recevez des rappels en arrivant ou quittant un lieu',
    },
    {
      icon: 'lock-closed',
      title: 'Coffre-fort chiffré',
      description: 'Stockez vos documents sensibles en toute sécurité',
    },
    {
      icon: 'sparkles',
      title: 'Assistant IA',
      description: 'Optimisez votre planning avec l\'intelligence artificielle',
    },
    {
      icon: 'mail',
      title: 'Notifications SMS & Email',
      description: 'Recevez vos rappels par SMS et email',
    },
    {
      icon: 'phone-portrait',
      title: 'Multi-appareils',
      description: 'Synchronisez sur tous vos appareils',
    },
    {
      icon: 'color-palette',
      title: 'Thèmes Premium',
      description: 'Personnalisez l\'apparence de l\'application',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Premium</Text>
        <View style={{ width: 24 }} />
      </View>

      {isPremium ? (
        <View style={styles.premiumActive}>
          <Ionicons name="star" size={64} color="#FFD700" />
          <Text style={styles.premiumTitle}>Vous êtes Premium !</Text>
          <Text style={styles.premiumSubtitle}>
            Profitez de toutes les fonctionnalités avancées
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.hero}>
            <View style={styles.starIcon}>
              <Ionicons name="star" size={48} color="#FFD700" />
            </View>
            <Text style={styles.heroTitle}>Passez à Premium</Text>
            <Text style={styles.heroSubtitle}>
              Débloquez toutes les fonctionnalités avancées
            </Text>
          </View>

          <View style={styles.pricing}>
            <TouchableOpacity
              style={styles.pricingCard}
              onPress={() => handleSubscribe('monthly')}
              disabled={loading}
            >
              <Text style={styles.pricingTitle}>Mensuel</Text>
              <Text style={styles.pricingPrice}>9,99€</Text>
              <Text style={styles.pricingPeriod}>/mois</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pricingCard, styles.pricingCardFeatured]}
              onPress={() => handleSubscribe('yearly')}
              disabled={loading}
            >
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Populaire</Text>
              </View>
              <Text style={styles.pricingTitle}>Annuel</Text>
              <Text style={styles.pricingPrice}>79,99€</Text>
              <Text style={styles.pricingPeriod}>/an</Text>
              <Text style={styles.pricingSavings}>Économisez 20%</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <View style={styles.features}>
        <Text style={styles.featuresTitle}>Fonctionnalités Premium</Text>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name={feature.icon as any} size={24} color="#E6F4FE" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
            {isPremium && (
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  hero: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f9f9f9',
  },
  starIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  premiumActive: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#E8F5E9',
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  premiumSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  pricing: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  pricingCard: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pricingCardFeatured: {
    backgroundColor: '#E6F4FE',
    borderColor: '#E6F4FE',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  pricingPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  pricingPeriod: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  pricingSavings: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 8,
    fontWeight: '600',
  },
  features: {
    padding: 20,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
  },
});

