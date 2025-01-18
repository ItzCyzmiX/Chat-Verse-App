<script>
	import { goto } from "$app/navigation";
	import { slide, fade } from "svelte/transition";
	import supabase from "$lib/supabase";
	let email = $state("");
	let password = $state("");
	let username = $state("");
	let isLoginMode = $state(true);
	let loading = $state(false);
	let showToast = $state(false);
	let toastMessage = $state("");
	let toastType = $state("success");

	async function handleSubmit(e) {
		e.preventDefault();
		if (password.length < 8) {
			showToast = true;
			toastMessage = "password must be at least 8 characters long!";
			toastType = "error";
			loading = false;
			return;
		}
		loading = true;
		if (isLoginMode) {
			let { data, error } = await supabase.auth.signInWithPassword({
				email: email,
				password: password,
			});
			if (error) {
				showToast = true;
				toastMessage = error.message;
				toastType = "error";
				loading = false;
			} else {
				goto("/chats");
			}
		} else {
			let { data, error } = await supabase.auth.signUp({
				email: email,
				password: password,
				options: { data: { username: username } },
			});
			if (error) {
				showToast = true;
				toastMessage = error.message;
				toastType = "error";
				loading = false;
				return;
			} else {
				const res = await supabase
					.from("messages")
					.insert([
						{
							user_id: data.user.id,
							msg_json: {
								messages: {},
							},
						},
					])
					.select();

				goto("/chats");
			}
		}
	}
</script>
<svelte:head>
	<title>Begin your journey in Chatverse</title>
</svelte:head>
// Toast component
{#if showToast}
	<div
		transition:fade
		class="fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg {toastType ===
		'error'
			? 'bg-red-500'
			: 'bg-green-500'} text-white flex items-center gap-2"
	>
		{#if toastType === "error"}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
					clip-rule="evenodd"
				/>
			</svg>
		{:else}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
					clip-rule="evenodd"
				/>
			</svg>
		{/if}
		{toastMessage}
	</div>
{/if}

{#if loading}
	<div
		class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
		transition:slide
	>
		<div
			class="bg-zinc-800 p-8 rounded-xl border-2 border-white/20 flex flex-col items-center gap-4"
		>
			<div
				class="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"
			></div>
			<p class="text-white font-medium">
				Processing {isLoginMode ? "login" : "registration"}...
			</p>
		</div>
	</div>
{/if}
<div class="min-h-screen text-white p-8 {loading ? 'blur-sm' : ''}">
	{#if isLoginMode}
		<div class="min-h-screen text-white p-8">
			<div class="fixed inset-0 -z-[11] h-full w-full bg-black">
				<div
					class="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px]"
				></div>
				<div
					class="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px]"
				></div>
			</div>

			<div class="max-w-md mx-auto">
				<div
					class="bg-zinc-800/30 rounded-xl p-8 border-2 border-white/20"
				>
					<h1 class="text-3xl font-bold text-center mb-8">Login</h1>

					<form onsubmit={handleSubmit} class="space-y-6">
						<div>
							<label
								for="email"
								class="block text-sm font-medium mb-2"
								>Email</label
							>
							<input
								type="email"
								id="email"
								bind:value={email}
								class="w-full bg-zinc-900/50 border-2 border-white/20 rounded-xl px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-white/40"
								placeholder="Enter your email"
								required
							/>
						</div>

						<div>
							<label
								for="password"
								class="block text-sm font-medium mb-2"
								>Password</label
							>
							<input
								type="password"
								id="password"
								bind:value={password}
								class="w-full bg-zinc-900/50 border-2 border-white/20 rounded-xl px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-white/40"
								placeholder="Enter your password"
								required
							/>
						</div>

						<button
							type="submit"
							class="w-full bg-white text-black px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:shadow-lg hover:shadow-white/20 hover:scale-105"
						>
							Login
						</button>
					</form>

					<p class="text-center mt-6 text-zinc-400">
						Don't have an account?
						<button
							onclick={() => (isLoginMode = !isLoginMode)}
							class="text-white hover:underline"
						>
							{isLoginMode ? "Register" : "Login"}
						</button>
					</p>
				</div>
			</div>
		</div>
	{:else}
		<div class="min-h-screen text-white p-8">
			<div class="fixed inset-0 -z-[11] h-full w-full bg-black">
				<div
					class="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px]"
				></div>
				<div
					class="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px]"
				></div>
			</div>

			<div class="max-w-md mx-auto">
				<div
					class="bg-zinc-800/30 rounded-xl p-8 border-2 border-white/20"
				>
					<h1 class="text-3xl font-bold text-center mb-8">
						Register
					</h1>

					<form onsubmit={handleSubmit} class="space-y-6">
						<div>
							<label
								for="username"
								class="block text-sm font-medium mb-2"
								>Username</label
							>
							<input
								type="text"
								id="username"
								bind:value={username}
								class="w-full bg-zinc-900/50 border-2 border-white/20 rounded-xl px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-white/40"
								placeholder="Enter your username"
								required
							/>
						</div>

						<div>
							<label
								for="email"
								class="block text-sm font-medium mb-2"
								>Email</label
							>
							<input
								type="email"
								id="email"
								bind:value={email}
								class="w-full bg-zinc-900/50 border-2 border-white/20 rounded-xl px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-white/40"
								placeholder="Enter your email"
								required
							/>
						</div>

						<div>
							<label
								for="password"
								class="block text-sm font-medium mb-2"
								>Password</label
							>
							<input
								type="password"
								id="password"
								bind:value={password}
								class="w-full bg-zinc-900/50 border-2 border-white/20 rounded-xl px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-white/40"
								placeholder="Enter your password"
								required
							/>
						</div>

						<button
							type="submit"
							class="w-full bg-white text-black px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:shadow-lg hover:shadow-white/20 hover:scale-105"
						>
							Login
						</button>
					</form>

					<p class="text-center mt-6 text-zinc-400">
						Don't have an account?
						<button
							onclick={() => (isLoginMode = !isLoginMode)}
							class="text-white hover:underline"
						>
							{isLoginMode ? "Register" : "Login"}
						</button>
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>
