import React, { createContext, useContext, useState } from 'react';
import { SND_CLICK, SND_SENT, SND_RECEIVED } from './SoundAssets';

const SoundContext = createContext();

export const useSound = () => useContext(SoundContext);

export const SoundProvider = ({ children }) => {
    const [soundEnabled, setSoundEnabled] = useState(() => {
        const saved = localStorage.getItem('sound_enabled');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const toggleSound = (enabled) => {
        setSoundEnabled(enabled);
        localStorage.setItem('sound_enabled', JSON.stringify(enabled));
    };

    // Helper to play sound
    const playSound = (src, volume = 0.5, pitch = 1.0) => {
        if (!soundEnabled) return;
        try {
            if (typeof Audio === "undefined") return;

            const audio = new Audio(src);
            audio.volume = volume;
            // Pitch/Speed control
            if (audio.preservesPitch !== undefined) {
                audio.preservesPitch = false;
            }
            audio.playbackRate = pitch;

            const promise = audio.play();
            if (promise !== undefined) {
                promise.catch(error => {
                    // console.warn("Audio Playback Failed", error);
                });
            }
        } catch (e) {
            console.error("Audio Critical Error:", e);
        }
    };

    // User Interface Sounds
    const playClick = () => playSound(SND_CLICK, 0.3, 1.0);
    const playSuccess = () => playSound(SND_CLICK, 0.4, 1.5);
    const playError = () => playSound(SND_CLICK, 0.4, 0.5);

    // Chat Sounds: Now Distinct
    const playMessageSent = () => playSound(SND_SENT, 0.5, 1.0);
    const playMessageReceived = () => playSound(SND_RECEIVED, 0.7, 1.0);

    return (
        <SoundContext.Provider value={{ soundEnabled, toggleSound, playClick, playSuccess, playError, playMessageSent, playMessageReceived }}>
            {children}
        </SoundContext.Provider>
    );
};
