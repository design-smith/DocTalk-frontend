import React, { useEffect, useRef, useState } from 'react';

interface SpeechRecognitionProps {
  onTranscript: (transcript: string, audioData: number[]) => void;
}

const SpeechRecognition: React.FC<SpeechRecognitionProps> = ({ onTranscript }) => {
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [isListening, setIsListening] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentTranscriptRef = useRef<string>('');
  const speechStartTimeRef = useRef<number | null>(null);
  const minSpeechDuration = 2000; // 2 seconds in milliseconds

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    // Initialize Audio Context
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;

    // Setup recognition handlers
    recognitionRef.current.onstart = () => {
      setIsListening(true);
      currentTranscriptRef.current = '';
      speechStartTimeRef.current = null;
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      // Restart recognition after a brief pause
      setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.start();
        }
      }, 100);
    };

    recognitionRef.current.onaudiostart = () => {
      speechStartTimeRef.current = Date.now();
    };

    recognitionRef.current.onresult = (event: any) => {
      let transcript = '';
      const currentTime = Date.now();
      const speechDuration = speechStartTimeRef.current 
        ? currentTime - speechStartTimeRef.current 
        : 0;

      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const finalTranscript = event.results[i][0].transcript;
          if (speechDuration >= minSpeechDuration) {
            onTranscript(finalTranscript, getAudioData());
            currentTranscriptRef.current = '';
            speechStartTimeRef.current = null;
          }
        } else {
          transcript = event.results[i][0].transcript;
          
          // Clear previous timeout if it exists
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          
          // Only send transcript if minimum duration has passed
          if (speechDuration >= minSpeechDuration) {
            timeoutRef.current = setTimeout(() => {
              onTranscript(transcript, getAudioData());
              currentTranscriptRef.current = '';
              speechStartTimeRef.current = null;
            }, 1000);
            
            currentTranscriptRef.current = transcript;
          } else {
            console.log(`Speech duration: ${speechDuration}ms, waiting for ${minSpeechDuration}ms minimum`);
          }
        }
      }
    };

    recognitionRef.current.onspeechend = () => {
      // If we have accumulated enough speech duration when speech ends, send final transcript
      const finalDuration = speechStartTimeRef.current 
        ? Date.now() - speechStartTimeRef.current 
        : 0;
        
      if (finalDuration >= minSpeechDuration && currentTranscriptRef.current) {
        onTranscript(currentTranscriptRef.current, getAudioData());
        currentTranscriptRef.current = '';
        speechStartTimeRef.current = null;
      }
    };

    // Start recognition
    recognitionRef.current.start();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [onTranscript]);

  const getAudioData = (): number[] => {
    if (!analyserRef.current) return [];
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    return Array.from(dataArray);
  };

  return (
    <div className="voice-indicator">
      <div className={`indicator ${isListening ? 'active' : ''}`}>
        {isListening 
          ? speechStartTimeRef.current 
            ? `Recording (${Math.floor((Date.now() - speechStartTimeRef.current) / 1000)}s)` 
            : 'Waiting for speech...'
          : 'Not listening'
        }
      </div>
    </div>
  );
};

export default SpeechRecognition;