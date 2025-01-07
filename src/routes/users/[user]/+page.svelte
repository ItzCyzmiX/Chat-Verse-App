<script>
    import { goto } from "$app/navigation";
    import supabase from "$lib/supabase";
    import { onMount } from "svelte";

    const userData = {
        name: " ",
        profilePicture: "",
        createdBots: [],
    };

    onMount(async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        userData.name = user.user_metadata.username;
        userData.profilePicture =
            "https://api.dicebear.com/7.x/avataaars/svg?seed=" +
            user.user_metadata.username;
        userData.createdBots = user.user_metadata.createdBots || [];
    });

    async function logout() {
        const { data, error } = await supabase.auth.signOut();
        if (error) {
            console.error("Logout failed:", error);
        } else {
            goto("/login");
        }
    }
</script>

<div class="min-h-screen text-white p-4 sm:p-8">
    <div class="fixed inset-0 -z-[11] h-full w-full bg-black">
        <div
            class="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px]"
        ></div>
        <div
            class="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px]"
        ></div>
    </div>
            <!-- Mobile Navigation Bar -->
        <div
            class="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t-2 border-white/20 p-3 flex justify-around items-center sm:hidden z-50"
        >
            <a href={`/new`} class="flex flex-col items-center text-white/50">
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
                href={`/users/${userData.name}`}
                class="flex flex-col items-center text-white"
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

    <div class="max-w-7xl mx-auto">
        <div
            class="mb-8 sm:mb-12 bg-zinc-800/30 rounded-xl p-4 sm:p-8 border-2 border-white/20"
        >
            <div class="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
                <img
                    src={userData.profilePicture}
                    alt={userData.name}
                    class="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white/20"
                />
                <div class="flex-grow text-center sm:text-left">
                    <h1 class="text-2xl sm:text-4xl font-bold mb-2">
                        {userData.name}
                    </h1>
                    <p class="text-zinc-400">@{userData.name}</p>
                </div>
                <button
                    class="w-full sm:w-auto bg-red-500/20 text-red-500 px-6 py-2 rounded-lg hover:bg-red-500/30 transition-colors"
                    onclick={logout}
                >
                    Log Out
                </button>
            </div>
        </div>

        <section class="mb-8 sm:mb-12">
            <h2 class="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
                Created Chatbots
            </h2>
            <div
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
            >
                {#if userData.createdBots.length === 0}
                    <p class="text-zinc-400">
                        You havent created any chatbots yet
                    </p>
                {:else}
                    {#each userData.createdBots as bot}
                        <div
                            class="bg-zinc-800/30 rounded-xl p-4 sm:p-6 transition-all duration-200 hover:transform hover:-translate-y-1 hover:bg-zinc-900 cursor-pointer border-2 border-white/20"
                        >
                            <h3 class="text-lg sm:text-xl font-bold mb-2">
                                {bot.name}
                            </h3>
                            <p class="text-zinc-400 text-xs sm:text-sm">
                                {bot.title}
                            </p>
                            <p class="text-zinc-500 text-xs mt-4">
                                Created: {new Date(
                                    bot.createdAt,
                                ).toLocaleDateString()}
                            </p>
                        </div>
                    {/each}
                {/if}
            </div>
        </section>
    </div>
</div>
