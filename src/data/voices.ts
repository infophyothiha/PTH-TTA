import { VoiceOption, StyleOption } from '../types';

export const VOICES: VoiceOption[] = [
  {
    name: 'Kore',
    gender: 'Female',
    tone: 'Warm & Natural',
    description: 'Balanced, clear, and soothing. Ideal for narration, audiobooks, and everyday conversational speech.',
  },
  {
    name: 'Puck',
    gender: 'Male',
    tone: 'Playful & Friendly',
    description: 'Dynamic, expressive, and upbeat. Great for lively dialogs, character voices, and podcasts.',
  },
  {
    name: 'Charon',
    gender: 'Male',
    tone: 'Deep & Authoritative',
    description: 'Rich baritone with gravitas. Suited for news broadcasts, documentaries, and formal announcements.',
  },
  {
    name: 'Fenrir',
    gender: 'Male',
    tone: 'Crisp & Dramatic',
    description: 'Distinctive, commanding, and focused. Perfect for cinematic trailers and dramatic audiobooks.',
  },
  {
    name: 'Zephyr',
    gender: 'Female',
    tone: 'Gentle & Melodic',
    description: 'Soft, airy, and calming. Wonderful for meditation guides, bedtime stories, and poetic reflections.',
  },
];

export const STYLES: StyleOption[] = [
  { id: 'natural', label: 'Natural', promptPrefix: '' },
  { id: 'cheerful', label: 'Cheerful', promptPrefix: 'Say cheerfully: ' },
  { id: 'calm', label: 'Calm & Soothing', promptPrefix: 'Read calmly and soothingly: ' },
  { id: 'dramatic', label: 'Dramatic', promptPrefix: 'Say dramatically with intensity: ' },
  { id: 'professional', label: 'Professional', promptPrefix: 'Announce professionally and clearly: ' },
  { id: 'whispering', label: 'Whisper', promptPrefix: 'Whisper softly: ' },
];

export interface PresetSample {
  id: string;
  category: string;
  title: string;
  mode: 'single' | 'multi';
  voice?: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  style: 'natural' | 'cheerful' | 'calm' | 'dramatic' | 'professional' | 'whispering';
  speaker1Name?: string;
  speaker1Voice?: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  speaker2Name?: string;
  speaker2Voice?: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  text: string;
}

export const PRESET_SAMPLES: PresetSample[] = [
  {
    id: 'narration',
    category: 'Storytelling',
    title: 'The Silent Lighthouse',
    mode: 'single',
    voice: 'Kore',
    style: 'calm',
    text: 'Beyond the rugged cliffs where the ocean meets the misty horizon, the old lighthouse stood watchful. Each sweep of its golden beam pierced the dusk, guiding travelers safely across the restless waters.',
  },
  {
    id: 'announcement',
    category: 'Broadcast',
    title: 'Flight Departure',
    mode: 'single',
    voice: 'Charon',
    style: 'professional',
    text: 'Good afternoon passengers. This is the final boarding call for Pacific Airlines flight 412 with nonstop service to Seattle. Please have your boarding pass and photo identification ready at Gate 18.',
  },
  {
    id: 'dialogue',
    category: 'Conversation',
    title: 'Two-Person Dialogue',
    mode: 'multi',
    speaker1Name: 'Joe',
    speaker1Voice: 'Kore',
    speaker2Name: 'Jane',
    speaker2Voice: 'Puck',
    style: 'natural',
    text: "Joe: How is the new text to speech model performing on your test suite?\nJane: It's remarkably responsive! The voice modulation and natural cadence are virtually indistinguishable from a studio recording.",
  },
  {
    id: 'cheerful_greeting',
    category: 'Greeting',
    title: 'Morning Motivation',
    mode: 'single',
    voice: 'Puck',
    style: 'cheerful',
    text: 'Good morning, everyone! Today is full of fresh possibilities and exciting milestones. Take a deep breath, brew your favorite coffee, and make something extraordinary happen!',
  },
  {
    id: 'meditation',
    category: 'Mindfulness',
    title: 'Evening Breath',
    mode: 'single',
    voice: 'Zephyr',
    style: 'calm',
    text: 'Gently close your eyes and release the tension from your shoulders. Inhale slowly through your nose, allowing your mind to settle into quiet stillness.',
  },
];
