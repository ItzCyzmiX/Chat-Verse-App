<script>
    import { fade, slide } from "svelte/transition";
    import supabase from "$lib/supabase";
    import { goto } from "$app/navigation";
    import {onMount} from "svelte"
    let showToast = $state(false);
    let toastMessage = $state("");
    let toastType = $state("");
    let loading = $state(false);
    let username = $state('')
    let botData = {
        name: "",
        description: "",
        behavior: "",
        relationship: "",
    };
    onMount(async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        username = user.user_metadata.username;
    })
    async function handleSubmit(e) {
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
        setTimeout(() => {
            showToast = false;
            goto("/chats");
        }, 3000);
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
            class="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t-2 border-white/20 p-3 flex justify-around items-center sm:hidden z-50 "
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
        </div>                    <div
            class="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t-2 border-white/20 p-3 flex justify-around items-center sm:hidden z-50 "
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
    <div class="w-full max-w-3xl mx-auto">
        <div class="mb-6 sm:mb-8">
            <h1 class="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">
                Create New Chatbot
            </h1>
            <p class="text-zinc-400 text-sm sm:text-base">
                Design your perfect AI companion by filling out the details
                below.
            </p>
        </div>

        <form onsubmit={handleSubmit} class="space-y-4 sm:space-y-6">
            <div class="space-y-4">
                <div>
                    <label
                        for="name"
                        class="block text-sm font-medium text-zinc-300 mb-2"
                        >Bot Name</label
                    >
                    <input
                        type="text"
                        id="name"
                        bind:value={botData.name}
                        placeholder="e.g. freakbobo, skibid toilet"
                        class="w-full bg-zinc-800/30 border-2 border-white/20 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 text-sm sm:text-base"
                        required
                    />
                </div>

                <div>
                    <label
                        for="description"
                        class="block text-sm font-medium text-zinc-300 mb-2"
                        >Description</label
                    >
                    <textarea
                        id="description"
                        bind:value={botData.description}
                        placeholder="Brief description of your chatbot..."
                        class="w-full bg-zinc-800/30 border-2 border-white/20 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 h-20 sm:h-24 text-sm sm:text-base"
                        required
                    ></textarea>
                </div>

                <div>
                    <label
                        for="behavior"
                        class="block text-sm font-medium text-zinc-300 mb-2"
                        >Behavior & Personality</label
                    >
                    <textarea
                        id="behavior"
                        bind:value={botData.behavior}
                        placeholder="Describe how your bot should behave and interact... yes it can be freaky, but not too much weirdo"
                        class="w-full bg-zinc-800/30 border-2 border-white/20 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 h-28 sm:h-32 text-sm sm:text-base"
                        required
                    ></textarea>
                </div>

                <div>
                    <label
                        for="relationship"
                        class="block text-sm font-medium text-zinc-300 mb-2"
                        >Relationship with Users</label
                    >
                    <textarea
                        id="relationship"
                        bind:value={botData.relationship}
                        placeholder="How should the bot relate to users? (e.g. friendly mentor, curious student)... step sister? go wild idc"
                        class="w-full bg-zinc-800/30 border-2 border-white/20 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 h-28 sm:h-32 text-sm sm:text-base"
                        required
                    ></textarea>
                </div>
            </div>

            <div
                class="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-6"
            >
                <button
                    type="submit"
                    class="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-black font-medium hover:bg-zinc-200 transition-all duration-200 text-sm sm:text-base"
                >
                    Create Chatbot
                </button>
            </div>
        </form>

    </div>
</div>
