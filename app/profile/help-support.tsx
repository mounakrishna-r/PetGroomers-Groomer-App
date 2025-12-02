import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Colors';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  expanded?: boolean;
}

export default function HelpSupportScreen() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [faqs, setFaqs] = useState<FAQItem[]>([
    {
      id: 1,
      question: 'How do I receive payments?',
      answer: 'Payments are processed weekly. Complete your bank details in Edit Profile to receive payments directly to your account. You can track your earnings in the Earnings tab.',
      expanded: false,
    },
    {
      id: 2,
      question: 'What if a customer cancels?',
      answer: 'If a customer cancels before you start service, no penalty applies. If they cancel after you arrive, you will receive a cancellation fee. Contact support if you have concerns.',
      expanded: false,
    },
    {
      id: 3,
      question: 'How do I update my services?',
      answer: 'Services are managed by the admin based on your region and certification. Contact support to add new services or change your service offerings.',
      expanded: false,
    },
    {
      id: 4,
      question: 'What is the commission structure?',
      answer: 'You receive 70% of each order value. Platform fee is 20%, and 18% GST is applied on the platform fee. View detailed breakdown in Service Settings.',
      expanded: false,
    },
    {
      id: 5,
      question: 'How do I verify my account?',
      answer: 'Complete your profile with all required details including bank information. Our team will verify your documents within 24-48 hours. You can check KYC status in Edit Profile.',
      expanded: false,
    },
    {
      id: 6,
      question: 'Can I set my own availability?',
      answer: 'Yes, you can set your working hours and days off in the Settings tab. Update your availability anytime to control when you receive order requests.',
      expanded: false,
    },
  ]);

  const handleSubmitTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Missing Information', 'Please fill in both subject and message.');
      return;
    }

    setSubmitting(true);
    try {
      // In production: Send to backend API
      // await GroomerAPI.submitSupportTicket({ subject, message });
      
      Alert.alert(
        'Support Ticket Submitted',
        'Our team will respond within 24 hours. You can also reach us via WhatsApp for urgent issues.',
        [{ text: 'OK', onPress: () => {
          setSubject('');
          setMessage('');
        }}]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit ticket. Please try again or contact us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsApp = () => {
    const phoneNumber = '919876543210'; // Replace with actual support number
    const text = 'Hi, I need help with my PetGroomers account';
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(text)}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'WhatsApp is not installed on your device');
      }
    });
  };

  const handleCall = () => {
    const phoneNumber = '+919876543210'; // Replace with actual support number
    const url = `tel:${phoneNumber}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot make phone calls on this device');
      }
    });
  };

  const handleEmail = () => {
    const email = 'support@petgroomers.com';
    const subject = 'Groomer Support Request';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open email client');
      }
    });
  };

  const toggleFAQ = (id: number) => {
    setFaqs(faqs.map(faq => 
      faq.id === id ? { ...faq, expanded: !faq.expanded } : faq
    ));
  };

  const renderFAQItem = (faq: FAQItem) => (
    <TouchableOpacity
      key={faq.id}
      style={styles.faqCard}
      onPress={() => toggleFAQ(faq.id)}
      activeOpacity={0.7}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{faq.question}</Text>
        <Ionicons
          name={faq.expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.primary}
        />
      </View>
      {faq.expanded && (
        <Text style={styles.faqAnswer}>{faq.answer}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Quick Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Contact</Text>
          <View style={styles.quickContactRow}>
            <TouchableOpacity style={styles.quickContactButton} onPress={handleWhatsApp}>
              <View style={[styles.iconCircle, { backgroundColor: '#25D366' + '20' }]}>
                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              </View>
              <Text style={styles.quickContactLabel}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickContactButton} onPress={handleCall}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.primary + '20' }]}>
                <Ionicons name="call" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.quickContactLabel}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickContactButton} onPress={handleEmail}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.secondary + '20' }]}>
                <Ionicons name="mail" size={24} color={Colors.secondary} />
              </View>
              <Text style={styles.quickContactLabel}>Email</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit Ticket */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Submit Support Ticket</Text>
          <View style={styles.ticketCard}>
            <TextInput
              style={styles.input}
              placeholder="Subject"
              placeholderTextColor={Colors.text.disabled}
              value={subject}
              onChangeText={setSubject}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your issue..."
              placeholderTextColor={Colors.text.disabled}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmitTicket}
              disabled={submitting}
            >
              <LinearGradient
                colors={submitting ? [Colors.text.disabled, Colors.text.disabled] : Colors.gradients.primary}
                style={styles.submitGradient}
              >
                {submitting ? (
                  <Text style={styles.submitButtonText}>Submitting...</Text>
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={20} color={Colors.surface} />
                    <Text style={styles.submitButtonText}>Submit Ticket</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqs.map(faq => renderFAQItem(faq))}
        </View>

        {/* Support Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support Hours</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={Colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone & WhatsApp</Text>
                <Text style={styles.infoValue}>9:00 AM - 9:00 PM (Mon-Sun)</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color={Colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email & Tickets</Text>
                <Text style={styles.infoValue}>24/7 (Response within 24 hours)</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  section: {
    margin: Spacing.md,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  quickContactRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  quickContactButton: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  quickContactLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.medium,
  },
  ticketCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    height: 120,
    paddingTop: Spacing.md,
  },
  submitButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  submitButtonText: {
    color: Colors.surface,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  faqCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginRight: Spacing.sm,
  },
  faqAnswer: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  infoContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  infoLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.text.primary,
  },
});
