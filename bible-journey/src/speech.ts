import { requireOptionalNativeModule } from "expo";
import type { ExpoSpeechRecognitionModule } from "expo-speech-recognition";
export const speech = requireOptionalNativeModule<
  typeof ExpoSpeechRecognitionModule
>("ExpoSpeechRecognition");
