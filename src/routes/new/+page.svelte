<script>
	import { fade, slide, fly } from "svelte/transition";
	import { browser } from "$app/environment";
	import supabase from "$lib/supabase";
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	let showToast = $state(false);
	let toastMessage = $state("");
	let toastType = $state("");
	let loading = $state(false);
	let username = $state("");
	let botData = $state({
		name: "",
		description: "",
		behavior: "",
		relationship: "",
		greeting: "",
		avatarColor: "#4F46E5",
	});

	let isMobile = $state(false);

	// Check if device is mobile on client side
	if (browser) {
		const checkMobile = () => {
			isMobile = window.innerWidth < 1024; // lg breakpoint
		};

		// Initial check
		checkMobile();

		// Add resize listener
		window.addEventListener("resize", checkMobile);
	}
	onMount(async () => {
		const {
			data: { user },
		} = await supabase.auth.getUser();
		username = user.user_metadata.username;
	});

	let activeTab = $state("basic");

	async function handleSubmit(e) {
		if (
			!botData.name ||
			!botData.description ||
			!botData.behavior ||
			!botData.relationship
		) {
			showToast = true;
			toastMessage = "Fill all the feild!";
			toastType = "error";

			setTimeout(() => {
				showToast = false;
			}, 3000);

			return;
		}

		e.preventDefault();
		loading = true;
		const {
			data: { user },
		} = await supabase.auth.getUser();
		let username = user.user_metadata.username;
		let { data, error } = await supabase.from("chat_bots").insert({
			name: botData.name,
			description: botData.description,
			behavior: botData.behavior,
			relationship: botData.relationship,
			creator: username,
			greeting: botData.greeting || "",
		});
		if (error) {
			showToast = true;
			toastMessage = error.message;
			toastType = "error";
		} else {
			showToast = true;
			toastMessage = "Bot created successfully!";
			toastType = "success";

			let prevBots = user.user_metadata.createdBots || [];
			const { data, error } = await supabase.auth.updateUser({
				data: {
					createdBots: [
						...prevBots,
						{
							name: botData.name,
							description: botData.description,
							behavior: botData.behavior,
							relationship: botData.relationship,
							creator: username,
							createdAt: new Date().toISOString(),
						},
					],
				},
			});
		}

		loading = false;
		if (toastType !== "error") {
			setTimeout(() => {
				showToast = false;
				goto("/chats");
			}, 1000);
		}
	}
</script>

{#if loading}
	<div
		class="fixed inset-0 bg-transparent flex items-center justify-center z-50"
		in:slide
		out:fade
	>
		<div
			class="bg-zinc-800 p-8 rounded-xl border-2 border-white/20 flex flex-col items-center gap-4"
		>
			<div
				class="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"
			></div>
			<p class="text-white font-medium">Creating your bot...</p>
		</div>
	</div>
{/if}

// Toast component
{#if showToast}
	<div
		transition:fade
		class="fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg {toastType ===
		'error'
			? 'bg-red-500'
			: 'bg-green-500'} text-white"
	>
		{toastMessage}
	</div>
{/if}

<div class="min-h-screen text-white p-4 sm:p-8 {loading ? 'blur-sm' : ''}">
	<div class="fixed inset-0 -z-[11] h-full w-full bg-black">
		<div
			class="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px]"
		></div>
		<div
			class="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px]"
		></div>
	</div>
	<div
		class="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t-2 border-white/20 p-3 flex justify-around items-center sm:hidden z-50"
	>
		<a href={`/new`} class="flex flex-col items-center text-white">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 4v16m8-8H4"
				/>
			</svg>

			<span class="text-xs mt-1">New Bot</span>
		</a>
		<a href="/chats" class="flex flex-col items-center text-white/50">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
					clip-rule="evenodd"
				/>
			</svg>

			<span class="text-xs mt-1">Bots</span>
		</a>
		<a
			href={`/users/${username}`}
			class="flex flex-col items-center text-white/50"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
					clip-rule="evenodd"
				/>
			</svg>
			<span class="text-xs mt-1">Profile</span>
		</a>
	</div>
	<div
		class="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t-2 border-white/20 p-3 flex justify-around items-center sm:hidden z-50"
	>
		<a href={`/new`} class="flex flex-col items-center text-white">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 4v16m8-8H4"
				/>
			</svg>

			<span class="text-xs mt-1">New Bot</span>
		</a>
		<a href="/chats" class="flex flex-col items-center text-white/50">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
					clip-rule="evenodd"
				/>
			</svg>

			<span class="text-xs mt-1">Bots</span>
		</a>
		<a
			href={`/users/${username}`}
			class="flex flex-col items-center text-white/50"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
					clip-rule="evenodd"
				/>
			</svg>
			<span class="text-xs mt-1">Profile</span>
		</a>
	</div>

	<div class="w-full max-w-4xl mx-auto p-4">
		<div class="mb-8">
			<h1 class="text-4xl font-bold mb-4">Design Your AI Companion</h1>
			<p class="text-zinc-400">
				Create a unique personality for your custom chatbot
			</p>
		</div>
		{#if isMobile}
			<div class="grid md:grid-cols-[300px,1fr] gap-6">
				<!-- Form -->
				<div class="order-1 md:order-2">
					<div
						class="bg-zinc-900 rounded-xl border border-white/10 p-6"
					>
						<form onsubmit={handleSubmit}>
							<div class="mb-6">
								<div class="flex gap-4 mb-6">
									<button
										type="button"
										onclick={() => (activeTab = "basic")}
										class="px-4 py-2 rounded-lg {activeTab ===
										'basic'
											? 'bg-white text-black'
											: 'bg-zinc-800/30 text-zinc-400'}"
									>
										Basic Info
									</button>
									<button
										type="button"
										onclick={() =>
											(activeTab = "personality")}
										class="px-4 py-2 rounded-lg {activeTab ===
										'personality'
											? 'bg-white text-black'
											: 'bg-zinc-800/30 text-zinc-400'}"
									>
										Personality
									</button>
									<button
										type="button"
										onclick={() => (activeTab = "preveiw")}
										class="px-4 py-2 rounded-lg {activeTab ===
										'preveiw'
											? 'bg-white text-black'
											: 'bg-zinc-800/30 text-zinc-400'}"
									>
										Preveiw
									</button>
								</div>

								{#if activeTab === "basic"}
									<div
										class="space-y-4"
										in:fly={{ x: -30, duration: 500 }}
									>
										<div>
											<!-- svelte-ignore a11y_label_has_associated_control -->
											<label
												class="block text-sm font-medium text-zinc-300 mb-2"
											>
												Bot Name
											</label>
											<input
												required
												type="text"
												bind:value={botData.name}
												placeholder="e.g. Athena, RoboGuide"
												class="w-full bg-zinc-800/30 border-2 border-white/20 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white/40"
											/>
										</div>

										<div>
											<!-- svelte-ignore a11y_label_has_associated_control -->
											<label
												class="block text-sm font-medium text-zinc-300 mb-2"
											>
												Description
											</label>
											<textarea
												required
												bind:value={botData.description}
												placeholder="A brief introduction to your bot..."
												class="w-full bg-zinc-800/30 border-2 border-white/20 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 h-24"
											></textarea>
										</div>

										<div>
											<!-- svelte-ignore a11y_label_has_associated_control -->
											<label
												class="block text-sm font-medium text-zinc-300 mb-2"
											>
												Greeting Message
											</label>
											<textarea
												bind:value={botData.greeting}
												placeholder="How should your bot greet users?"
												class="w-full bg-zinc-800/30 border-2 border-white/20 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 h-24"
											></textarea>
										</div>
									</div>
								{:else if activeTab === "personality"}
									<div
										class="space-y-4"
										in:fly={{ x: -30, duration: 500 }}
									>
										<div>
											<!-- svelte-ignore a11y_label_has_associated_control -->
											<label
												class="block text-sm font-medium text-zinc-300 mb-2"
											>
												Behavior & Personality
											</label>
											<textarea
												required
												bind:value={botData.behavior}
												placeholder="Describe how your bot should behave and interact..."
												class="w-full bg-zinc-800/30 border-2 border-white/20 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 h-32"
											></textarea>
										</div>

										<div>
											<!-- svelte-ignore a11y_label_has_associated_control -->
											<label
												class="block text-sm font-medium text-zinc-300 mb-2"
											>
												Relationship with Users
											</label>
											<textarea
												required
												bind:value={botData.relationship}
												placeholder="How should the bot relate to users?"
												class="w-full bg-zinc-800/30 border-2 border-white/20 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 h-32"
											></textarea>
										</div>
									</div>
								{:else}
									<div
										class="order-2 md:order-1"
										in:fly={{ x: -30, duration: 500 }}
									>
										<div
											class="sticky top-4 bg-zinc-900 rounded-xl border border-white/10 p-6"
										>
											<div
												class="flex flex-col items-center"
											>
												<div
													class="w-32 h-32 rounded-full mb-4 overflow-hidden bg-zinc-800/30 flex items-center justify-center"
												>
													<span
														class="text-4xl font-bold text-white"
														>{botData.name[0]}</span
													>
												</div>

												<h2
													class="text-xl font-bold mb-2"
												>
													{botData.name ||
														"Your Bot Name"}
												</h2>
												<p
													class="text-sm text-zinc-400 text-center mb-4"
												>
													{botData.description ||
														"Bot description will appear here"}
												</p>

												<div
													class="w-full p-4 bg-zinc-800/30 rounded-lg mt-4"
												>
													<p
														class="text-sm italic text-zinc-300"
													>
														"{botData.greeting ||
															"Your greeting message will appear here"}"
													</p>
												</div>
											</div>
										</div>
									</div>
								{/if}
							</div>

							<div class="flex justify-end gap-4">
								<a
									href="/chats"
									class="px-6 py-3 rounded-lg bg-zinc-800/30 text-white hover:bg-zinc-800/50 transition-all duration-200"
								>
									Cancel
								</a>
								<button
									onclick={(e) => {
										if (activeTab === "basic")
											activeTab = "personality";
										else if (activeTab === "personality")
											activeTab = "preveiw";
										else {
											handleSubmit(e);
										}
									}}
									type="button"
									class="px-6 py-3 rounded-lg bg-white text-black font-medium hover:bg-zinc-200 transition-all duration-200"
								>
									{activeTab === "preveiw"
										? "Create Bot"
										: "Next"}
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		{:else}
			<div class="w-full max-w-4xl mx-auto p-4">
				<div class="grid md:grid-cols-[300px,1fr] gap-6">
					<!-- Preview Card -->
					<div class="order-2 md:order-1">
						<div
							class="sticky top-4 bg-zinc-900 rounded-xl border border-white/10 p-6"
						>
							<div class="flex flex-col items-center">
								<div
									class="w-32 h-32 rounded-full mb-4 overflow-hidden bg-zinc-800/30 flex items-center justify-center"
								>
									<span class="text-4xl font-bold text-white"
										>{botData.name[0]}</span
									>
								</div>

								<h2 class="text-xl font-bold mb-2">
									{botData.name || "Your Bot Name"}
								</h2>
								<p
									class="text-sm text-zinc-400 text-center mb-4"
								>
									{botData.description ||
										"Bot description will appear here"}
								</p>

								<div
									class="w-full p-4 bg-zinc-800/30 rounded-lg mt-4"
								>
									<p class="text-sm italic text-zinc-300">
										"{botData.greeting ||
											"Your greeting message will appear here"}"
									</p>
								</div>
							</div>
						</div>
					</div>

					<!-- Form -->
					<div class="order-1 md:order-2">
						<div
							class="bg-zinc-900 rounded-xl border border-white/10 p-6"
						>
							<form onsubmit={handleSubmit}>
								<div class="mb-6">
									<div class="flex gap-4 mb-6">
										<button
											type="button"
											onclick={() =>
												(activeTab = "basic")}
											class="px-4 py-2 rounded-lg {activeTab ===
											'basic'
												? 'bg-white text-black'
												: 'bg-zinc-800/30 text-zinc-400'}"
										>
											Basic Info
										</button>
										<button
											type="button"
											onclick={() =>
												(activeTab = "personality")}
											class="px-4 py-2 rounded-lg {activeTab ===
											'personality'
												? 'bg-white text-black'
												: 'bg-zinc-800/30 text-zinc-400'}"
										>
											Personality
										</button>
									</div>

									{#if activeTab === "basic"}
										<div class="space-y-4">
											<div>
												<label
													class="block text-sm font-medium text-zinc-300 mb-2"
												>
													Bot Name
												</label>
												<input
													type="text"
													bind:value={botData.name}
													placeholder="e.g. Athena, RoboGuide"
													class="w-full bg-zinc-800/30 border-2 border-white/20 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white/40"
												/>
											</div>

											<div>
												<label
													class="block text-sm font-medium text-zinc-300 mb-2"
												>
													Description
												</label>
												<textarea
													bind:value={botData.description}
													placeholder="A brief introduction to your bot..."
													class="w-full bg-zinc-800/30 border-2 border-white/20 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 h-24"
												></textarea>
											</div>

											<div>
												<label
													class="block text-sm font-medium text-zinc-300 mb-2"
												>
													Greeting Message
												</label>
												<textarea
													bind:value={botData.greeting}
													placeholder="How should your bot greet users?"
													class="w-full bg-zinc-800/30 border-2 border-white/20 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 h-24"
												></textarea>
											</div>
										</div>
									{:else}
										<div class="space-y-4">
											<div>
												<label
													class="block text-sm font-medium text-zinc-300 mb-2"
												>
													Behavior & Personality
												</label>
												<textarea
													bind:value={botData.behavior}
													placeholder="Describe how your bot should behave and interact..."
													class="w-full bg-zinc-800/30 border-2 border-white/20 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 h-32"
												></textarea>
											</div>

											<div>
												<label
													class="block text-sm font-medium text-zinc-300 mb-2"
												>
													Relationship with Users
												</label>
												<textarea
													bind:value={botData.relationship}
													placeholder="How should the bot relate to users?"
													class="w-full bg-zinc-800/30 border-2 border-white/20 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 h-32"
												></textarea>
											</div>
										</div>
									{/if}
								</div>

								<div class="flex justify-end gap-4">
									<a
										href="/chats"
										type="button"
										class="px-6 py-3 rounded-lg bg-zinc-800/30 text-white hover:bg-zinc-800/50 transition-all duration-200"
									>
										Cancel
									</a>
									<button
										onclick={(e) => {
											if (activeTab === "basic") {
												activeTab = "personality";
											} else {
												handleSubmit(e);
											}
										}}
										type="button"
										class="px-6 py-3 rounded-lg bg-white text-black font-medium hover:bg-zinc-200 transition-all duration-200"
									>
										{activeTab === "basic"
											? "Next"
											: "Create Bot"}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
