import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppScrollView } from '../components/AppScrollView';
import { useUserStore } from '../store/userStore';
import {
  COLORS,
  GENDER_OPTIONS,
  INTEREST_OPTIONS,
  LOOKING_FOR_OPTIONS,
  type Gender,
  type LookingFor,
} from '../utils/constants';
import { hapticLight, hapticSelection, hapticSuccess } from '../utils/haptics';
import { headerText } from '../utils/typography';
import { PROFILE_PROMPTS, type ProfilePrompt } from '../utils/profilePrompts';
import { isValidPhoneNumber, normalizePhoneInput } from '../utils/phone';

interface OnboardingScreenProps {
  userId: string;
  onComplete: () => void;
}

type OnboardingStep = 'photos' | 'name' | 'age' | 'gender' | 'looking_for' | 'bio' | 'prompts' | 'interests' | 'phone';

const STEPS: OnboardingStep[] = [
  'photos',
  'name',
  'age',
  'gender',
  'looking_for',
  'bio',
  'prompts',
  'interests',
  'phone',
];

const STEP_TITLES: Record<OnboardingStep, string> = {
  photos: 'Add your photos',
  name: "What's your name?",
  age: 'How old are you?',
  gender: 'I am',
  looking_for: "I'm looking for",
  bio: 'Tell us about yourself',
  prompts: 'Answer a few prompts',
  interests: 'What are you into?',
  phone: 'Your phone number',
};

const STEP_SUBTITLES: Record<OnboardingStep, string> = {
  photos: 'Add at least one photo so matches can see you',
  name: 'This is how you will appear on HitItOff',
  age: 'You must be 18 or older to use HitItOff',
  gender: 'Select the option that best describes you',
  looking_for: 'Who would you like to discover?',
  bio: 'Share a little about yourself (optional)',
  prompts: 'Optional — helps our AI find better matches',
  interests: 'Pick up to 8 interests (optional)',
  phone: 'Optional — saved privately so you can exchange numbers with matches later',
};

export function OnboardingScreen({ userId, onComplete }: OnboardingScreenProps) {
  const { saveOnboarding, isLoading } = useUserStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [lookingFor, setLookingFor] = useState<LookingFor | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [profilePrompts, setProfilePrompts] = useState<ProfilePrompt[]>([]);
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [photoMimeTypes, setPhotoMimeTypes] = useState<string[]>([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const ageInputRef = useRef<TextInput>(null);

  const currentStep = STEPS[stepIndex];
  const progress = ((stepIndex + 1) / STEPS.length) * 100;
  const isLastStep = stepIndex === STEPS.length - 1;

  useEffect(() => {
    if (currentStep !== 'age') return;

    const timer = setTimeout(() => {
      ageInputRef.current?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [currentStep]);

  const pickPhoto = async () => {
    if (photoUris.length >= 6) {
      Alert.alert('Limit reached', 'You can add up to 6 photos');
      return;
    }

    hapticLight();

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
      preferredAssetRepresentationMode:
        ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });

    if (!result.canceled && result.assets[0]) {
      hapticSelection();
      setPhotoUris((prev) => [...prev, result.assets[0].uri].slice(0, 6));
      setPhotoMimeTypes((prev) =>
        [...prev, result.assets[0].mimeType ?? 'image/jpeg'].slice(0, 6),
      );
    }
  };

  const removePhoto = (index: number) => {
    hapticLight();
    setPhotoUris((prev) => prev.filter((_, i) => i !== index));
    setPhotoMimeTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleInterest = (interest: string) => {
    hapticSelection();
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : prev.length < 8
          ? [...prev, interest]
          : prev,
    );
  };

  const validateStep = (): boolean => {
    switch (currentStep) {
      case 'photos':
        if (photoUris.length === 0) {
          Alert.alert('Add a photo', 'Please add at least one photo to continue');
          return false;
        }
        return true;
      case 'name':
        if (!name.trim()) {
          Alert.alert('Name required', 'Please enter your name');
          return false;
        }
        return true;
      case 'age': {
        const ageNum = parseInt(age, 10);
        if (!ageNum || ageNum < 18) {
          Alert.alert('Invalid age', 'Please enter a valid age (18+)');
          return false;
        }
        return true;
      }
      case 'gender':
        if (!gender) {
          Alert.alert('Select gender', 'Please select your gender');
          return false;
        }
        return true;
      case 'looking_for':
        if (!lookingFor) {
          Alert.alert('Select preference', 'Please select who you are looking for');
          return false;
        }
        return true;
      case 'phone':
        if (phoneNumber.trim() && !isValidPhoneNumber(phoneNumber)) {
          Alert.alert('Invalid number', 'Please enter a valid phone number or leave it blank');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    const ageNum = parseInt(age, 10);
    if (!gender || !lookingFor) return;

    try {
      await saveOnboarding(userId, {
        name: name.trim(),
        age: ageNum,
        bio: bio.trim(),
        interests,
        gender,
        looking_for: lookingFor,
        photoUris,
        photoMimeTypes,
        profilePrompts: profilePrompts.filter((p) => p.answer.trim()),
        phoneNumber: phoneNumber.trim(),
      });
      hapticSuccess();
      onComplete();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save profile');
    }
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    hapticLight();

    if (currentStep === 'name') {
      Keyboard.dismiss();
    }

    if (!isLastStep) {
      setStepIndex((i) => i + 1);
      return;
    }

    await handleSubmit();
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      hapticLight();
      setStepIndex((i) => i - 1);
    }
  };

  const selectGender = (value: Gender) => {
    hapticSelection();
    setGender(value);
  };

  const selectLookingFor = (value: LookingFor) => {
    hapticSelection();
    setLookingFor(value);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'photos':
        return (
          <View style={styles.stepContent}>
            <AppScrollView horizontal style={styles.photoRow}>
              {photoUris.map((uri, i) => (
                <View key={uri} style={styles.photoWrap}>
                  <Image source={{ uri }} style={styles.photoPreview} />
                  <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removePhoto(i)}>
                    <Ionicons name="close" size={14} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
              ))}
              {photoUris.length < 6 && (
                <TouchableOpacity style={styles.addPhotoBtn} onPress={pickPhoto}>
                  <Ionicons name="add" size={36} color={COLORS.primary} />
                  <Text style={styles.addPhotoText}>Add photo</Text>
                </TouchableOpacity>
              )}
            </AppScrollView>
          </View>
        );

      case 'name':
        return (
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={COLORS.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
          />
        );

      case 'age':
        return (
          <TextInput
            ref={ageInputRef}
            key="age-input"
            style={styles.input}
            placeholder="Age"
            placeholderTextColor={COLORS.textMuted}
            value={age}
            onChangeText={(text) => setAge(text.replace(/\D/g, ''))}
            keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
            inputMode="numeric"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            textContentType="none"
            maxLength={2}
            returnKeyType="done"
          />
        );

      case 'gender':
        return (
          <View style={styles.options}>
            {GENDER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.option, gender === option.id && styles.optionSelected]}
                onPress={() => selectGender(option.id)}
              >
                <Text style={[styles.optionText, gender === option.id && styles.optionTextSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'looking_for':
        return (
          <View style={styles.options}>
            {LOOKING_FOR_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.option, lookingFor === option.id && styles.optionSelected]}
                onPress={() => selectLookingFor(option.id)}
              >
                <Text
                  style={[styles.optionText, lookingFor === option.id && styles.optionTextSelected]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'bio':
        return (
          <TextInput
            style={[styles.input, styles.bioInput]}
            placeholder="Write something about yourself..."
            placeholderTextColor={COLORS.textMuted}
            value={bio}
            onChangeText={setBio}
            multiline
            maxLength={300}
            autoFocus
          />
        );

      case 'prompts':
        return (
          <AppScrollView style={styles.interestsScroll}>
            {PROFILE_PROMPTS.slice(0, 3).map((prompt) => {
              const existing = profilePrompts.find((p) => p.prompt === prompt);
              return (
                <View key={prompt} style={styles.promptBlock}>
                  <Text style={styles.promptLabel}>{prompt}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Your answer (optional)"
                    placeholderTextColor={COLORS.textMuted}
                    value={existing?.answer ?? ''}
                    onChangeText={(answer) => {
                      setProfilePrompts((prev) => {
                        const filtered = prev.filter((p) => p.prompt !== prompt);
                        if (!answer.trim()) return filtered;
                        return [...filtered, { prompt, answer }];
                      });
                    }}
                    maxLength={150}
                  />
                </View>
              );
            })}
          </AppScrollView>
        );

      case 'interests':
        return (
          <AppScrollView style={styles.interestsScroll}>
            <View style={styles.chips}>
              {INTEREST_OPTIONS.map((interest) => (
                <TouchableOpacity
                  key={interest}
                  style={[styles.chip, interests.includes(interest) && styles.chipActive]}
                  onPress={() => toggleInterest(interest)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      interests.includes(interest) && styles.chipTextActive,
                    ]}
                  >
                    {interest}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </AppScrollView>
        );

      case 'phone':
        return (
          <TextInput
            style={styles.input}
            placeholder="(555) 123-4567"
            placeholderTextColor={COLORS.textMuted}
            value={phoneNumber}
            onChangeText={(text) => setPhoneNumber(normalizePhoneInput(text))}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
            maxLength={20}
            autoFocus
          />
        );

      default:
        return null;
    }
  };

  return (
    <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.inner}
        >
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>

          <Text style={styles.stepLabel}>
            Step {stepIndex + 1} of {STEPS.length}
          </Text>
          <Text style={styles.title}>{STEP_TITLES[currentStep]}</Text>
          <Text style={styles.subtitle}>{STEP_SUBTITLES[currentStep]}</Text>

          <View style={styles.body}>{renderStepContent()}</View>

          <View style={styles.footer}>
            {stepIndex > 0 && (
              <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.nextBtn, stepIndex === 0 && styles.nextBtnFull]}
              onPress={handleNext}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.text} />
              ) : (
                <Text style={styles.nextBtnText}>
                  {isLastStep ? 'Continue to Quiz' : 'Next'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  inner: { flex: 1 },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginHorizontal: 24,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  stepLabel: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 8,
  },
  title: {
    ...headerText,
    color: COLORS.text,
    fontSize: 26,
    lineHeight: 34,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContent: {
    flex: 1,
  },
  photoRow: {
    flexGrow: 0,
  },
  photoWrap: {
    position: 'relative',
    marginRight: 12,
  },
  photoPreview: {
    width: 140,
    height: 175,
    borderRadius: 16,
    backgroundColor: COLORS.card,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.text,
  },
  addPhotoBtn: {
    width: 140,
    height: 175,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
  addPhotoText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    color: COLORS.text,
    fontSize: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bioInput: {
    height: 160,
    textAlignVertical: 'top',
  },
  options: {
    gap: 12,
  },
  option: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 77, 141, 0.12)',
  },
  optionText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  interestsScroll: {
    flex: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 24,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: { color: COLORS.textMuted, fontSize: 14 },
  chipTextActive: { color: COLORS.text, fontWeight: '600' },
  promptBlock: {
    marginBottom: 16,
  },
  promptLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
  },
  backBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  backBtnText: { color: COLORS.textMuted, fontSize: 16, fontWeight: '600' },
  nextBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  nextBtnFull: { flex: 1 },
  nextBtnText: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
});
