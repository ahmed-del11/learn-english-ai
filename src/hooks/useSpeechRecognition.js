import { useState, useEffect, useRef, useCallback } from 'react';

export const useSpeechRecognition = (onResult, onEnd) => {
    const [isListening, setIsListening] = useState(false);
    const [supported, setSupported] = useState(true);
    const recognitionRef = useRef(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            let fullTranscript = '';
            for (let i = 0; i < event.results.length; ++i) {
                fullTranscript += event.results[i][0].transcript;
            }
            
            if (onResult) {
                onResult(fullTranscript.toLowerCase(), event.results[event.results.length - 1].isFinal);
            }
        };

        recognition.onend = () => {
            setIsListening(false);
            if (onEnd) onEnd();
        };

        recognition.onerror = (event) => {
            console.error("Speech Recognition Error:", event.error);
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [onResult, onEnd]);

    const startListening = useCallback(() => {
        if (!recognitionRef.current) return;
        try {
            recognitionRef.current.start();
            setIsListening(true);
        } catch (e) {
            console.error("Start Error:", e);
        }
    }, []);

    const stopListening = useCallback(() => {
        if (!recognitionRef.current) return;
        try {
            recognitionRef.current.stop();
        } catch (e) {
            console.error("Stop Error:", e);
        }
        setIsListening(false);
    }, []);

    return { isListening, startListening, stopListening, supported };
};
