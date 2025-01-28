// recorder.js
import { Capacitor } from '@capacitor/core';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import groq from '$lib/groq';



class CrossPlatformRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.initialize();
    }

    async initialize() {
        if (Capacitor.isNativePlatform()) {
            const { value } = await VoiceRecorder.hasAudioRecordingPermission();
            if (!value) {
                await VoiceRecorder.requestAudioRecordingPermission();
            }
        }
    }

    async startRecording() {
        if (this.isRecording) return;
        this.isRecording = true;

        if (Capacitor.isNativePlatform()) {
            await VoiceRecorder.startRecording();
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.mediaRecorder = new MediaRecorder(stream);
                this.audioChunks = [];

                this.mediaRecorder.ondataavailable = (event) => {
                    this.audioChunks.push(event.data);
                };

                this.mediaRecorder.start();
            } catch (error) {
                this.isRecording = false;
                throw new Error(`Failed to start web recording: ${error}`);
            }
        }
    }

    async stopRecording() {
        if (!this.isRecording) {
            throw new Error('No recording in progress');
        }

        this.isRecording = false;

        if (Capacitor.isNativePlatform()) {
            const result = await VoiceRecorder.stopRecording();
            // Convert base64 to File object
            const blob = this.base64ToBlob(result.value.recordDataBase64, 'audio/wav');
            return new File([blob], 'recording.wav', { type: 'audio/wav' });
        } else {
            return new Promise((resolve, reject) => {
                if (!this.mediaRecorder) {
                    reject(new Error('MediaRecorder not initialized'));
                    return;
                }

                this.mediaRecorder.onstop = () => {
                    try {
                        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
                        const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
                        resolve(file);
                    } catch (error) {
                        reject(error);
                    }
                };

                this.mediaRecorder.stop();
                const tracks = this.mediaRecorder.stream.getTracks();
                tracks.forEach(track => track.stop());
            });
        }
    }

    base64ToBlob(base64, mimeType) {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    async transcribeAudio(audioFile, language) {
        try {
            const response = await groq.audio.transcriptions.create({
                file: audioFile,
                model: 'whisper-large-v3',
                prompt: "Specify context or spelling", 
                response_format: "json",
                language: language,
                temperature: 0.0
            });
            return response.text;
        } catch (error) {
            throw new Error(`Transcription failed: ${error.message}`);
        }
    }

    async isRecordingInProgress() {
        if (Capacitor.isNativePlatform()) {
            const status = await VoiceRecorder.getCurrentStatus();
            return status.value.isRecording;
        }
        return this.isRecording;
    }
}

export const createRecorder = () => new CrossPlatformRecorder();