import { Capacitor } from '@capacitor/core';
import { VoiceRecorder } from 'capacitor-voice-recorder';
class CrossPlatformRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
		this.groqApiKey = import.meta.env.VITE_GROQ_API_KEY
        this.debugLogs = [];
    }

    addDebugLog(message, isError = false) {
        const timestamp = new Date().toLocaleTimeString();
        this.debugLogs.unshift({
            timestamp,
            message: typeof message === 'object' ? JSON.stringify(message, null, 2) : message,
            isError
        });
        if (this.debugLogs.length > 20) this.debugLogs.pop();
    }

    async checkPermitions() {
        if (Capacitor.isNativePlatform()) {
            try {
                const { value } = await VoiceRecorder.hasAudioRecordingPermission();
                if (!value) {
                    await VoiceRecorder.requestAudioRecordingPermission();
                }
            } catch (error) {
                this.addDebugLog(`Permission error: ${error.message}`, true);
                throw error;
            }
        }
    }

    async startRecording() {
        if (this.isRecording) return;

		await this.checkPermitions()
		
		
		this.isRecording = true;


        if (Capacitor.isNativePlatform()) {
            try {
                await VoiceRecorder.startRecording();
                this.addDebugLog('Native recording started');
            } catch (error) {
                this.isRecording = false;
                this.addDebugLog(`Native recording error: ${error.message}`, true);
                throw error;
            }
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.mediaRecorder = new MediaRecorder(stream, {
                    mimeType: 'audio/webm;codecs=opus'
                });
                this.audioChunks = [];

                this.mediaRecorder.ondataavailable = (event) => {
                    this.audioChunks.push(event.data);
                };

                this.mediaRecorder.start();
                this.addDebugLog('Web recording started');
            } catch (error) {
                this.isRecording = false;
                throw error;
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
                const result = await VoiceRecorder.stopRecording();
                this.addDebugLog('Native recording stopped');

                if (!result.value || !result.value.recordDataBase64) {
                    throw new Error('Invalid recording data received from device');
                }

                // For native recordings, use the base64 directly since it's already in the correct format
                const base64Data = result.value.recordDataBase64;
                // Validate the base64 data
                if (!this.isValidBase64(base64Data)) {
                    throw new Error('Invalid base64 data received from device');
                }

                this.addDebugLog(`Native recording base64 length: ${base64Data.length}`);
                return {
                    base64Data,
                    mimeType: 'audio/wav'  // Native recordings are typically WAV
                };
            } catch (error) {
                this.addDebugLog(`Error in native recording: ${error.message}`, true);
                throw error;
            }
        } else {
            return new Promise((resolve, reject) => {
                try {
                    this.mediaRecorder.onstop = async () => {
                        try {
                            const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
                            const base64Data = await this.blobToBase64(blob);
                            this.addDebugLog(`Web recording base64 length: ${base64Data.length}`);
                            resolve({
                                base64Data,
                                mimeType: 'audio/webm'
                            });
                        } catch (error) {
                            reject(error);
                        }
                    };

                    this.mediaRecorder.stop();
                    const tracks = this.mediaRecorder.stream.getTracks();
                    tracks.forEach(track => track.stop());
                } catch (error) {
                    reject(error);
                }
            });
        }
    }

    isValidBase64(str) {
        if (typeof str !== 'string') return false;
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        return base64Regex.test(str) && str.length > 0;
    }

    async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    // Extract only the base64 data, removing the data URL prefix
                    const base64Data = reader.result.split(',')[1];
                    resolve(base64Data);
                } else {
                    reject(new Error('Failed to convert blob to base64'));
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    base64ToBlob(base64Data, mimeType) {
        try {
            // Convert base64 to raw binary data
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            return new Blob([bytes], { type: mimeType });
        } catch (error) {
            this.addDebugLog(`Error converting base64 to blob: ${error.message}`, true);
            throw error;
        }
    }

    async transcribeAudio(audioData) {
        if (!this.groqApiKey) {
            throw new Error('GROQ API key is required for transcription');
        }

        try {
            // Create a blob from the base64 data
            const audioBlob = this.base64ToBlob(audioData.base64Data, audioData.mimeType);
            
            // Create a File object from the blob
            const audioFile = new File([audioBlob], 
                `recording.${audioData.mimeType.split('/')[1]}`,
                { type: audioData.mimeType }
            );

            this.addDebugLog(`Preparing transcription request:
                File size: ${audioFile.size} bytes
                File type: ${audioFile.type}`);

            const formData = new FormData();
            formData.append('file', audioFile);
            formData.append('model', 'whisper-large-v3');

            const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.groqApiKey}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`GROQ API error: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            return result.text;
        } catch (error) {
            this.addDebugLog(`Transcription error: ${error.message}`, true);
            throw error;
        }
    }

    getDebugLogs() {
        return this.debugLogs;
    }
}

export const createRecorder = () => new CrossPlatformRecorder();