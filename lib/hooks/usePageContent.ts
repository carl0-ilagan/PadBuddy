'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export interface FAQ {
  question: string;
  answer: string;
}

export interface ContactMethod {
  title: string;
  description: string;
  contact: string;
}

export interface QuickTip {
  emoji: string;
  title: string;
  description: string;
}

export interface HelpContent {
  faqs: FAQ[];
  contactMethods: ContactMethod[];
  quickTips: QuickTip[];
}

export interface TeamMember {
  name: string;
  role: string;
  image: string;
}

export interface AboutContent {
  mission: string;
  features: { title: string; description: string }[];
  benefits: string[];
  team: TeamMember[];
  version: string;
}

const defaultAboutContent: AboutContent = {
  mission: 'PadBuddy is dedicated to empowering Filipino rice farmers with smart technology solutions. We provide an intuitive platform that helps farmers monitor their fields, track crop growth, and make data-driven decisions to improve yields and farming efficiency.',
  features: [
    { title: 'Field Management', description: 'Easily create and manage multiple rice fields with detailed information about each field\'s variety, planting date, and status.' },
    { title: 'Device Monitoring', description: 'Connect and monitor IoT devices across your paddies to track real-time sensor data including NPK levels, temperature, and humidity.' },
    { title: 'Growth Tracking', description: 'Track your rice crop\'s growth stages automatically based on planting date and variety, with recommended activities for each stage.' },
    { title: 'Data Analytics', description: 'View comprehensive statistics and trends for your fields, helping you make informed decisions about your farming operations.' }
  ],
  benefits: [
    'Real-time monitoring of your rice fields',
    'Automated growth stage tracking',
    'NPK level monitoring for optimal fertilization',
    'Device status alerts and notifications',
    'Comprehensive field statistics and analytics',
    'Support for multiple rice varieties',
    'Mobile-first design for on-the-go access',
    'Offline capability with PWA support'
  ],
  team: [
    { name: 'Theus Vito', role: 'Full Stack Main Programmer', image: '/Theus Vito.jpg' },
    { name: 'Kai Manguiflor', role: 'Hardware', image: '/Kai Manguiflor.jpg' },
    { name: 'Lester Bruit', role: 'Hardware', image: '/Lester Bruit.jpg' },
    { name: 'Carl Ilagan', role: 'Front End', image: '/Carl Ilagan.jpg' },
    { name: 'Allan Pedraza', role: 'Documentation', image: '/Allan Pedraza.jpg' }
  ],
  version: '1.0.0'
};

const defaultHelpContent: HelpContent = {
  faqs: [
    { question: 'How do I add a new field?', answer: 'Click the \'+\' button on the home page, fill in the field details (name, description, rice variety, and start date), then add your paddies and connect devices.' },
    { question: 'How do I connect a device to my field?', answer: 'When adding a new field, you\'ll be prompted to add a paddy and connect a device. Enter the device ID from your physical device to connect it.' },
    { question: 'What rice varieties are supported?', answer: 'PadBuddy supports various rice varieties including IR64, NSIC Rc216, NSIC Rc222, and more. Check the Rice Varieties page for a complete list with detailed information.' },
    { question: 'How do I track my field\'s growth stages?', answer: 'Navigate to your field\'s detail page and check the Overview tab. It shows the current growth stage, progress, and recommended activities based on your rice variety.' },
    { question: 'What should I do if my device shows as offline?', answer: 'Check your device\'s power connection and internet connectivity. Ensure the device ID is correctly entered. If issues persist, try disconnecting and reconnecting the device.' },
    { question: 'How do I view sensor readings?', answer: 'Go to your field\'s detail page and click on the Statistics tab. You can view NPK levels, temperature, humidity, and water level data with different time ranges.' },
    { question: 'Can I manage multiple fields?', answer: 'Yes! You can create and manage multiple fields. Each field can have multiple paddies with different devices connected.' },
    { question: 'How do I update field information?', answer: 'Navigate to your field\'s detail page and click on the Information tab. From there, you can view and update field details.' }
  ],
  contactMethods: [
    { title: 'Email Support', description: 'Send us an email for assistance', contact: 'support@padbuddy.ph' },
    { title: 'Phone Support', description: 'Call us during business hours', contact: '+63 (2) 1234-5678' },
    { title: 'Live Chat', description: 'Chat with our support team', contact: 'Available 24/7' }
  ],
  quickTips: [
    { emoji: '📱', title: 'Mobile First', description: 'PadBuddy is optimized for mobile devices, making it easy to monitor your fields on the go.' },
    { emoji: '🌾', title: 'Variety Selection', description: 'Choose the right rice variety for your field to get accurate growth stage tracking and recommendations.' },
    { emoji: '📊', title: 'Regular Monitoring', description: 'Check your field statistics regularly to stay on top of NPK levels, temperature, and humidity.' },
    { emoji: '🔔', title: 'Notifications', description: 'Enable notifications to get alerts about important field activities and device status updates.' }
  ]
};

export function useAboutContent() {
  const [content, setContent] = useState<AboutContent>(defaultAboutContent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'aboutContent'),
      (doc) => {
        if (doc.exists()) {
          setContent(doc.data() as AboutContent);
        } else {
          setContent(defaultAboutContent);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching about content:', error);
        setContent(defaultAboutContent);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { content, loading };
}

export function useHelpContent() {
  const [content, setContent] = useState<HelpContent>(defaultHelpContent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'helpContent'),
      (doc) => {
        if (doc.exists()) {
          setContent(doc.data() as HelpContent);
        } else {
          setContent(defaultHelpContent);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching help content:', error);
        setContent(defaultHelpContent);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { content, loading };
}

