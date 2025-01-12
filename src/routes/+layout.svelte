<script>
	import { onMount } from "svelte";
	import { fly } from "svelte/transition";
	import "../app.css";
	import { App } from "@capacitor/app";
	let { children } = $props();

	let showPopUp = $state(false);

	onMount(() => {
		App.addListener("backButton", (e) => {
			if (showPopUp) {
				App.exitApp();
			}
			if (
				window.history.length > 1 &&
				window.location.pathname.includes("chat")
			) {
				window.history.back();
			} else {
				showPopUp = true;
			}
		});
	});

	function close() {
		App.exitApp();
	}
</script>

{#if showPopUp}
	<div
		class="fixed inset-0 bg-black z-50 flex items-center justify-center backdrop-blur-sm"
		transition:fly
	>
		<div
			class="bg-zinc-900 border-2 border-white/20 rounded-xl p-8 max-w-md w-full mx-4"
		>
			<div class="flex justify-between items-start mb-6">
				<button
					aria-label="Close Details"
					class="text-zinc-400 hover:text-white"
					onclick={() => (showPopUp = false)}
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
				<h1 class="text-3xl font-bold text-white">
					Do you want to exit Chatverse?
				</h1>
			</div>
			<button
				aria-label="Close app"
				class="bg-red-500/30 border-2 border-red-500 rounded-xl mx-auto px-2 ml-2 py-2 mt-6 text-white hover:bg-red-600/30 transition-all duration-200 w-full text-center"
				onclick={close}
			>
				<span class="font-medium flex justify-center"> Close </span>
			</button>
		</div>
	</div>
{/if}
<div>
	{@render children()}
</div>

<style>
	:global(body) {
		background-color: #000;
	}
</style>
