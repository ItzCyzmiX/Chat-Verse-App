<script>
import { fade, slide } from "svelte/transition";
import supabase from "$lib/supabase";
import { onMount } from "svelte";
import { goto } from "$app/navigation";
let userState = $state('loading');

// Check auth state on mount
onMount(async () => {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    userState = user;

    if (user) {
        goto(`/chats`);
    }
});
</script>

{#if userState === 'loading'}
    <div class="min-h-screen flex items-center justify-center text-white p-4 relative" transition:fade>
        <div class="fixed inset-0 -z-[11] h-full w-full bg-black">
            <div class="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            <div class="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        </div>
        <div class="bg-zinc-800/30 p-8 rounded-xl border border-white/20 max-w-md w-full backdrop-blur-sm" transition:slide>
            <div class="flex flex-col items-center">
                <div class="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
                <h2 class="text-2xl font-bold text-center animate-pulse">Loading...</h2>
            </div>
        </div>
    </div>
{:else if userState === null}
    <div class="min-h-screen flex items-center justify-center text-white p-4" transition:fade>
        <div class="fixed inset-0 -z-[11] h-full w-full bg-black">
            <div class="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            <div class="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        </div>
        <div class="bg-zinc-800/30 p-8 rounded-xl border border-white/20 max-w-md w-full backdrop-blur-sm">
            <h1 class="text-3xl font-bold mb-4 text-center bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Welcome to ChatVerse</h1>
            <p class="text-zinc-200 text-center mb-6 text-lg">
                Create and chat with personalized AI companions that understand you
            </p>
            <div class="space-y-4 mb-8">
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-purple-500/20 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <span class="text-zinc-200">Design unique AI personalities</span>
                </div>
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-pink-500/20 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-pink-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <span class="text-zinc-200">Build meaningful connections</span>
                </div>
            </div>
            <div class="space-y-3">
                <a
                    href="/login"
                    class="block w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 px-4 rounded-lg text-center font-medium transition-all "
                >
                    Get Started
                </a>
                <p class="text-zinc-400 text-center text-sm">Join thousands of users exploring AI companionship</p>
            </div>
        </div>
    </div>
{/if}