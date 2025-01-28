// recorder.js
import { Capacitor } from '@capacitor/core';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { Clipboard } from '@capacitor/clipboard';
class CrossPlatformRecorder {
	constructor() {
		this.mediaRecorder = null;
		this.audioChunks = [];
		this.isRecording = false;
		this.debugLogs = [];
	}

	addDebugLog(message, isError = false) {
		const timestamp = new Date().toLocaleTimeString();
		this.debugLogs.push({
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
                try {
                    await Clipboard.write({
                        string: base64Data
                    })
                }  catch (error) {
                    this.addDebugLog(`Copy error: ${error}`, true);
                }

				this.addDebugLog(`Base64 data: ${base64Data}`);

				// Ensure we're using a supported format for GROQ
				const blob = this.base64ToBlob(base64Data, 'audio/webm');
				this.addDebugLog(`Blob created: ${blob.size} bytes`);

				// Create file with .mp3 extension for better compatibility
				const file = new File([blob], 'recording.webm', {
					type: 'audio/webm',
					lastModified: new Date().getTime()
				});

				this.addDebugLog(`File created: ${file.name} (${file.size} bytes)`);
				return file;
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

				this.mediaRecorder.onstop = async () => {
					try {
						const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
                        let base = await this.blobToBase64(blob)
                        console.log(base)
						const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
						resolve(file);
					} catch (error) {
						reject(error);
					}
				};

				this.mediaRecorder.stop();
				const tracks = this.mediaRecorder.stream.getTracks();
				tracks.forEach((track) => track.stop());
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

    async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(blob);
        });
    }

	async transcribeAudio(audioFile, language) {
		try {
			try {
				this.addDebugLog(`Starting transcription process`);
				this.addDebugLog(`Audio file details:
            Name: ${audioFile.name}
            Size: ${audioFile.size} bytes
            Type: ${audioFile.type}`);

				const formData = new FormData();
				formData.append('file', audioFile);
				formData.append('model', 'whisper-large-v3');
                formData.append('language', language)

				this.addDebugLog('Sending request to GROQ API...');

				const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
						Accept: 'application/json'
					},
					body: formData
				});

				this.addDebugLog(`GROQ API response status: ${response.status}`);

				let responseText;
				try {
					// Try to get response as text first
					responseText = await response.text();
					this.addDebugLog(`Raw response: ${responseText}`);
				} catch (e) {
					this.addDebugLog(`Could not read response text: ${e.message}`, true);
				}

				if (!response.ok) {
					// Try to parse the error response as JSON
					let errorDetail = responseText;
					try {
						const errorJson = JSON.parse(responseText);
						errorDetail = errorJson.error?.message || errorJson.message || responseText;
					} catch (e) {
						// If parsing fails, use the raw text
					}
					this.addDebugLog(`GROQ API error: ${errorDetail}`, true);
					throw new Error(`GROQ API error: ${response.status} - ${errorDetail}`);
				}

				let result;
				try {
					result = JSON.parse(responseText);
				} catch (e) {
					this.addDebugLog(`Error parsing JSON response: ${e.message}`, true);
					throw new Error('Invalid JSON response from GROQ API');
				}

				if (!result.text) {
					this.addDebugLog('No transcription text in response', true);
					throw new Error('No transcription text in response');
				}

				this.addDebugLog('Transcription completed successfully');
				return result.text;
			} catch (error) {
				this.addDebugLog(`Transcription error: ${error.message}`, true);

				// If it's a network error, add more details
				if (error instanceof TypeError && error.message === 'Failed to fetch') {
					this.addDebugLog('Network error - possible causes:', true);
					this.addDebugLog('- Invalid API key', true);
					this.addDebugLog('- No internet connection', true);
					this.addDebugLog('- GROQ API service unavailable', true);
				}

				throw error;
			}
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
