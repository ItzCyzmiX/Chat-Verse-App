// recorder.js
import { Capacitor } from '@capacitor/core';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import groq from '$lib/groq';



class CrossPlatformRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.debugLogs = [];
    }

    addDebugLog(message, isError = false) {
        const timestamp = new Date().toLocaleTimeString();
        this.debugLogs.unshift({
            timestamp,
            message: typeof message === 'object' ? JSON.stringify(message, null, 2) : message,
            isError
        });
        // Keep only last 20 logs
        if (this.debugLogs.length > 20) {
            this.debugLogs.pop();
        }
    }

    async getPermission() {
        if (Capacitor.isNativePlatform()) {
            const { value } = await VoiceRecorder.hasAudioRecordingPermission();
            if (!value) {
                await VoiceRecorder.requestAudioRecordingPermission();
            }
        }
    }

    async startRecording() {
        if (this.isRecording) return;
        await this.getPermission();
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
            try {
                this.addDebugLog('Stopping native recording...');
                const result = await VoiceRecorder.stopRecording();
                this.addDebugLog('Recording stopped, processing data...');
    
                if (!result.value || !result.value.recordDataBase64) {
                    throw new Error('Invalid recording data received from device');
                }
    
                const base64Data = result.value.recordDataBase64;
                this.addDebugLog(`Base64 data length: ${base64Data.length}`);
                
                const blob = this.base64ToBlob(base64Data, 'audio/wav');
                this.addDebugLog(`Blob created: ${blob.size} bytes`);
    
                return new File([blob], 'recording.wav', { type: 'audio/wav' });
            } catch (error) {
                this.addDebugLog(`Error stopping recording: ${error.message}`, true);
                throw error;
            }
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
            this.addDebugLog(`Transcription error: ${error.message}`, true);
            throw error;
        }
    }

    async isRecordingInProgress() {
        if (Capacitor.isNativePlatform()) {
            const status = await VoiceRecorder.getCurrentStatus();
            return status.value.isRecording;
        }
        return this.isRecording;
    }

    getDebugLogs() {
        return this.debugLogs;
    }

    clearDebugLogs() {
        this.debugLogs = [];
    }
}

export const createRecorder = () => new CrossPlatformRecorder();