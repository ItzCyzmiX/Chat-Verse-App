<script>
	import { scale } from "svelte/transition";
	import { onMount } from "svelte";
	import supabase from "$lib/supabase";
	import groq from "$lib/groq";
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { browser } from "$app/environment";
	import { Media } from '@capacitor-community/media';
	import { Capacitor } from '@capacitor/core';

	let messages = $state([]);
	let newMessage = $state("");
	let showDetails = $state(false);
	let allOldMessages = $state({});

	let USER_ID = $state("");
	let username = $state("");
	let botCreator = $state("Unknown Creator");
	let botId = $page.params.bot;
	let botName = $state("");
	let botDescription = $state("Unknown Description");
	let botBehavior = $state("Unknown Behavior");
	let botRelationship = $state("Unknown Relationship");
	let botGreeting = $state("");

	let botThinking = $state(false);

	let chatContainer;

	let loadingChats = $state(true);

	let reseting = $state(false);

	// Function to scroll to bottom

	let shouldAutoScroll = true;

	// Function to scroll to bottom
	const scrollToBottom = (type = "smooth") => {
		if (!chatContainer) return;

		const shouldSmooth =
			document.body.clientHeight - window.innerHeight > 100;
		chatContainer.scrollTo({
			top: chatContainer.scrollHeight,
			behavior: type,
		});
	};

	// Handle scroll events to determine if user has manually scrolled up
	const handleScroll = () => {
		if (!chatContainer) return;

		const bottom =
			Math.abs(
				chatContainer.scrollHeight -
					chatContainer.clientHeight -
					chatContainer.scrollTop,
			) < 100;
		shouldAutoScroll = bottom;
	};
	$effect(() => {
		if (messages.length > 0 && shouldAutoScroll) {
			scrollToBottom("auto");
		}
	});

	let mediaRecorder;
	let isRecording = $state(false);
	let audioChunks = $state([]);
	let transcribing = $state(false)
	async function transcribe(audioBase64) {
		// Convert base64 to Blob
		const byteCharacters = atob(audioBase64);
		const byteNumbers = new Array(byteCharacters.length);
		for (let i = 0; i < byteCharacters.length; i++) {
			byteNumbers[i] = byteCharacters.charCodeAt(i);
		}
		const byteArray = new Uint8Array(byteNumbers);
		const audioBlob = new Blob([byteArray], { type: 'audio/wav' });

		// Create File object from Blob
		const audioFile = new File([audioBlob], 'audio.wav', { type: 'audio/wav' });
		const savedLanguage = localStorage.getItem('preferredLanguage') || "en"
		const transcription = await groq.audio.transcriptions.create({
			file: audioFile,
			model: "whisper-large-v3-turbo",
			prompt: "Specify context or spelling",
			response_format: "json",
			language: savedLanguage, 
			temperature: 0.0,
		});
		
		return transcription.text;
	}
	async function startRecording() {
		// Check if browser supports getUserMedia
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
			alert('Your browser does not support audio recording');
			return;
		}

		// Request permission explicitly first
		const permissionResult = await navigator.permissions.query({ name: 'microphone' });
		if (permissionResult.state === 'denied') {
			alert('Please allow microphone access in your browser settings to use voice recording');
			return;
		}

		

		if (Capacitor.getPlatform() !== 'web') {
			const CapacitorPermission = await Media.requestPermissions();
			if (!CapacitorPermission.microphone === 'granted') {
				alert('Please allow microphone access in your browser settings to use voice recording');
				return
			}
		}
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			mediaRecorder = new MediaRecorder(stream);
			isRecording = true;
			transcribing = true
			mediaRecorder.ondataavailable = (event) => {
				audioChunks.push(event.data);
			};

			mediaRecorder.onstop = async () => {
				const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
				audioChunks = [];
				
				// Convert blob to base64
				const reader = new FileReader();
				reader.readAsDataURL(audioBlob);
				reader.onloadend = async () => {
					const base64Audio = reader.result.split(',')[1];
					
					try {
						let text = await transcribe(base64Audio);
						newMessage = text;
						const savedAutoSend = localStorage.getItem('autoSendVoiceMessage') 
						let thebool = savedAutoSend === "true" ? true : false;
						transcribing = false
						if (thebool) {
							handleSubmit(new Event('submit'))
						}
					} catch (error) {
						alert('Transcription error:', error);
						console.log(error);
					}
				};
			};

			mediaRecorder.start();
		} catch (error) {
			alert('Error accessing microphone:', error);
		}
	}

	function stopRecording() {
		if (mediaRecorder && isRecording) {
			mediaRecorder.stop();
			isRecording = false;
			mediaRecorder.stream.getTracks().forEach(track => track.stop());
		}
	}



	onMount(async () => {
		let { data, error } = await supabase
			.from("chat_bots")
			.select("*")
			.eq("id", botId);

		if (error) {
			console.error(error);
		} else {
			botName = data[0].name;
			botCreator = data[0].creator;
			botDescription = data[0].description;
			botBehavior = data[0].behavior;
			botRelationship = data[0].relationship;
			botGreeting = data[0]?.greeting || "";
		}

		const {
			data: { user },
		} = await supabase.auth.getUser();
		USER_ID = user.id;
		username = user.user_metadata.username;
		{
			const res = await supabase
				.from("messages")
				.select("*")
				.eq("user_id", user.id)
				.single();

			try {
				if (res.data?.msg_json?.messages?.[botId].length > 0) {
					
					messages = res.data.msg_json?.messages?.[botId];
				} else {
					throw Error
				}
			} catch {
			
				if (botGreeting) {
					messages.push({
						role: "assistant",
						content: botGreeting,
						timestamp: new Date(),
					});
				}
			}

			// if (res.data?.msg_json?.messages?.[botId].length > 0) {
			// 	messages = res.data.msg_json?.messages?.[botId];
			// } else {
			// 	if (botGreeting) {
			// 		messages.push({
			// 			role: "assistant",
			// 			content: botGreeting,
			// 			timestamp: new Date(),
			// 		});
			// 	}
			// }
			allOldMessages = res.data?.msg_json?.messages || {};
		}

		loadingChats = false;

		scrollToBottom("auto");
	});
	async function handleSubmit(e) {
		e.preventDefault();
		botThinking = true;
		let temp = newMessage;
		newMessage = "";
		messages = [
			...messages,
			{ content: temp, role: "user", timestamp: new Date() },
		];
		shouldAutoScroll = true; // Force scroll on user message
		scrollToBottom();
		let filteredHistory = messages.map(
			({ ["timestamp"]: _, ...rest }) => rest,
		);
		let res = await groq.chat.completions.create({
			messages: [
				{
					role: "system",

					content: `your a person named ${botName}, with the following personality: ${botDescription}, your chatting with the user, your relationship with the user is: ${botRelationship}, act and respond in character, keep the conversation hype and flowing.` + ` respond in ${localStorage.getItem('preferredLanguage') || "en"}`,
				},

				...filteredHistory,
			],

			model: "llama-3.3-70b-versatile",

			temperature: 1,
		});
		let response = res.choices[0].message.content;
		botThinking = false;
		messages = [
			...messages,
			{ content: response, role: "assistant", timestamp: new Date() },
		];
		let temp_ = allOldMessages || {};
		temp_[botId] = messages;

		const { data, error } = await supabase
			.from("messages")
			.update({
				msg_json: {
					messages: {
						...temp_,
					},
				},
			})
			.eq("user_id", USER_ID)
			.select();

		scrollToBottom();
	}

	async function reset() {
		reseting = true;
		let temp = allOldMessages || {};

		temp[botId] = [];

		const { data, error } = await supabase
			.from("messages")
			.update({
				msg_json: {
					messages: {
						...temp,
					},
				},
			})
			.eq("user_id", USER_ID)
			.select();

		window.location.href = `/chat/${botId}`
	}
</script>

<svelte:head>
	<title>Chatting with {botName}</title>
</svelte:head>
<div class="h-screen flex flex-col">
	<div class="fixed inset-0 -z-[10] h-full w-full bg-black">
		<div
			class="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px]"
		></div>
		<div
			class="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px]"
		></div>
	</div>

	<!-- Header -->
	<div
		class="sticky top-0 z-50 bg-zinc-900/30 border-b-2 border-white/20 p-4 backdrop-blur-xl"
	>
		<div class="max-w-7xl mx-auto flex justify-between items-center">
			<div class="flex-1">
				<a
					href="/chats"
					class="inline-flex items-center text-zinc-400 hover:text-white transition-colors"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 19l-7-7m0 0l7-7m-7 7h18"
						/>
					</svg>
					<span class="ml-2">Back</span>
				</a>
			</div>
			<div class="text-center flex-1">
				<h1 class="lg:text-2xl md:text-sm font-bold text-white">
					{botName}
				</h1>
				<p class="text-sm text-zinc-400">Created by {botCreator}</p>
			</div>
			<div class="flex-1 flex justify-end">
				<button
					aria-label="Show Details"
					class="bg-zinc-800/30 border-2 border-white/20 rounded-xl p-2 text-white hover:bg-zinc-900/30 transition-all duration-200 flex items-center gap-2"
					onclick={() => (showDetails = true)}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span class="font-medium">About</span>
				</button>
			</div>
		</div>
	</div>

	{#if showDetails}
		<div
			class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm"
			transition:scale
		>
			<div
				class="bg-zinc-900 border-2 border-white/20 rounded-xl p-8 max-w-md w-full mx-4 sm:text-sm"
			>
				<div class="flex justify-between items-start mb-6">
					<h2 class="text-2xl font-bold text-white">
						{botName}'s Details
					</h2>
					<button
						aria-label="Close Details"
						class="text-zinc-400 hover:text-white"
						onclick={() => (showDetails = false)}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
				<div class="space-y-4">
					<div>
						<h3 class="text-zinc-400 text-sm">Description</h3>
						<p class="text-white">{botDescription}</p>
					</div>
					<div>
						<h3 class="text-zinc-400 text-sm">Behavior</h3>
						<p class="text-white">{botBehavior}</p>
					</div>
					<div>
						<h3 class="text-zinc-400 text-sm">Relationship</h3>
						<p class="text-white">{botRelationship}</p>
					</div>
					<p class="text-zinc-400 text-sm">
						brought to you by {botCreator}
					</p>
				</div>
				<button
					aria-label="Reset Conversation"
					class="bg-red-500/30 border-2 border-red-500 rounded-xl mx-auto px-2 ml-2 py-2 mt-6 text-white hover:bg-red-600/30 transition-all duration-200 w-full text-center"
					onclick={reset}
				>
					<span class="font-medium flex justify-center">
						{reseting ? "Reseting..." : "Reset Chat"}

						{#if reseting}
							<div
								class="ml-4 w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"
							></div>
						{/if}
					</span>
				</button>
			</div>
		</div>
	{/if}

	<!-- Chat Messages -->
	<div
		class="flex-1 overflow-y-auto p-4"
		bind:this={chatContainer}
		onscroll={handleScroll}
	>
		<div class="max-w-3xl mx-auto space-y-4 pb-20">
			{#if loadingChats}
				<div
					class="col-span-2 sm:col-span-2 lg:col-span-4 flex items-center justify-center p-4"
				>
					<div
						class="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"
					></div>
				</div>
			{/if}
			{#each messages as message}
				<div
					class="flex {message.role === 'user'
						? 'justify-end'
						: 'justify-start'}"
					in:scale
				>
					<div
						class="max-w-[80%] {message.role === 'user'
							? 'bg-white'
							: 'bg-zinc-800/30'} rounded-xl p-4 border-2 border-white/20"
					>
						<p class="">
							{#if message.role !== "user"}
								<span
									class="lg:text-lg md:text-sm text-gray-400"
								>
									{botName}:
								</span>
							{/if}

							<span
								class="{message.role === 'user'
									? 'text-black'
									: 'text-white'} font-medium text-sm sm:text-base"
							>
								{message.content}
							</span>
						</p>
						<p class="text-xs text-zinc-400 mt-1">
							{new Date(message.timestamp).toLocaleTimeString()}
						</p>
					</div>
				</div>
			{/each}
			{#if botThinking}
				<div class="flex justify-start" in:scale>
					<div
						class="max-w-[80%] bg-zinc-800/30 rounded-xl p-4 border-2 border-white/20"
					>
						<div
							class="col-span-2 sm:col-span-2 lg:col-span-4 flex items-center justify-center p-4"
						>
							<div
								class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"
							></div>
							<p class="ml-3 text-white font-medium">
								{botName} is thinking...
							</p>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Message Input -->
	<div
		class="fixed bottom-0 left-0 right-0 bg-zinc-900/80 backdrop-blur-sm p-4 border-t-2 border-white/20"
	>
		<div class="max-w-3xl mx-auto">
			<form onsubmit={handleSubmit} class="flex gap-2 sm:gap-4">
				<div class="relative flex-1">
					<input
						disabled={botThinking || transcribing || isRecording}
						type="text"
						bind:value={newMessage}
						placeholder={botThinking
							? `${botName} is typing...`
							: isRecording 
								? "Listening..."
								: !isRecording &&  transcribing 
								? "Transcribing..."
								: "Type your message..."}
						class="w-full bg-zinc-900/50 border-2 border-white/20 rounded-xl px-3 sm:px-4 py-2.5 text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
					>
					{#if transcribing}
						<div class="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex gap-1">
							<div class="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
							<div class="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
							<div class="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white rounded-full animate-bounce"></div>
						</div>
					{/if}
				</div>
				<button
					type="button"
					disabled={botThinking}
					onclick={isRecording ? stopRecording : startRecording}
					class="bg-zinc-800 text-white  px-4 py-2 sm:px-4 sm:py-2 rounded-xl font-medium transition-colors hover:bg-zinc-700 disabled:bg-gray-400 disabled:text-gray-800"
				>
					{#if isRecording}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 sm:h-6 sm:w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<rect x="6" y="6" width="12" height="12" stroke-width="2"/>
						</svg>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
						</svg>
					{/if}
				</button>
				<button
					aria-label="record"
					disabled={botThinking}
					type="submit"
					class="bg-white text-black  px-4 py-2 sm:px-4 sm:py-2 rounded-xl font-medium transition-colors hover:bg-zinc-200 disabled:bg-gray-400 disabled:text-gray-800"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12l-2 9 18-9-18-9 2 9zm0 0h8"/>
					</svg>
				</button>
			</form>
		</div>
	</div>
</div>
