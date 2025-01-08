<script>
    import { goto } from "$app/navigation";
    import supabase from "$lib/supabase";
    import { onMount } from "svelte";
    let errorMessage = $state("");
    let search = $state("");

    let myBots = $state([]);
    let username = $state("");
    let allBots = $state([]);
    let lastchated = $state([]);
    let randomBots = $state([]);

    let loading = $state(true);

    onMount(async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        const { data, error } = await supabase.from("chat_bots").select("*");
        if (!user?.user_metadata) {
            errorMessage = "You are not logged in";
        } else {
            username = user.user_metadata.username;
            myBots = user.user_metadata.createdBots || [];
            allBots = data || [];

            randomBots = allBots.filter((bot) => !myBots.includes(bot.name));
            randomBots = randomBots.slice(0, 4);
            
            if (user.user_metadata?.messages) {
                let lastnames =[]
                for (let i in user.user_metadata?.messages) {
                    lastnames.push(i)
                    
                }
                lastchated = allBots.filter((bot) => lastnames.includes(bot.name));
            }
            loading = false;
        }
        loading = false;
    });
</script>

{#if errorMessage}
    <div
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
    >
        <div
            class="bg-zinc-900 border-2 border-white/20 rounded-xl p-8 max-w-md w-full mx-4"
        >
            <div class="text-center">
                <h2 class="text-3xl text-red-500 font-bold mb-4">404</h2>
                <p class="text-zinc-400 mb-6">{errorMessage}</p>
                <button
                    class="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-zinc-200 transition-colors"
                    onclick={() => goto("/login")}
                >
                    Go to Login
                </button>
            </div>
        </div>
    </div>
{:else}
    <div class="min-h-screen text-white p-2 sm:p-8">
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
            <a href="/chats" class="flex flex-col items-center text-white">
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

        <!-- Desktop Navigation -->
        <div class="hidden sm:block">
            <div class="absolute top-8 left-8">
                <a
                    href="/new"
                    class="flex items-center gap-3 bg-zinc-800/30 border-2 border-white/20 rounded-xl px-6 py-3 text-white hover:bg-zinc-900 transition-all duration-200"
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
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                    <span class="font-medium">Create New Chatbot</span>
                </a>
            </div>
            <div class="absolute top-8 right-8">
                <a
                    href={`/users/${username}`}
                    class="flex items-center space-x-2 bg-zinc-800/30 border-2 border-white/20 rounded-xl px-4 py-2 text-white hover:bg-zinc-900 transition-all duration-200 w-fit"
                >
                    <div
                        class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-5 w-5 text-white"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                clip-rule="evenodd"
                            />
                        </svg>
                    </div>
                    <span class="font-medium">Profile</span>
                </a>
            </div>
        </div>

        <div class="mb-14 mt-16 sm:mt-32">
            <div class="flex justify-center px-4">
                <div class="relative w-full max-w-[90%] sm:max-w-96">
                    <input
                        oninput={(e) => {
                            search = e.target.value;
                        }}
                        type="text"
                        placeholder="Search chatbots..."
                        class="w-full bg-zinc-800/30 border-2 border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 shadow-md shadow-white/10 text-base"
                    />
                    <svg
                        class="w-5 h-5 text-zinc-500 absolute right-4 top-1/2 -translate-y-1/2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                    {#if search}
                        <div
                            class="absolute top-full left-0 right-0 mt-2 bg-zinc-800/95 border-2 border-white/20 rounded-xl overflow-hidden shadow-lg max-h-60 overflow-y-auto"
                        >
                            {#each allBots as bot}
                                {#if bot.name
                                    .toLowerCase()
                                    .includes(search.toLowerCase())}
                                    <a
                                        href={`/chat/${bot.name}`}
                                        class="flex items-center gap-3 p-3 hover:bg-zinc-700/50 transition-colors"
                                    >
                                        <div
                                            class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                                        >
                                            <span class="text-white font-medium"
                                                >{bot.name[0].toUpperCase()}</span
                                            >
                                        </div>
                                        <div>
                                            <p
                                                class="text-white font-medium text-sm"
                                            >
                                                {bot.name}
                                            </p>
                                            <p class="text-zinc-400 text-xs">
                                                by {bot.creator}
                                            </p>
                                        </div>
                                    </a>
                                {/if}
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
        </div>
        <div class="max-w-7xl mx-auto pb-24 sm:pb-0 px-2">
            <section class="mb-8">
                <h2 class="text-2xl sm:text-3xl font-bold text-white mb-4 px-2">
                    My Chatbots
                </h2>
                <div
                    class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6"
                >
                    {#if loading}
                        <div
                            class="col-span-2 sm:col-span-2 lg:col-span-4 flex items-center justify-center p-4"
                        >
                            <div
                                class="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"
                            ></div>
                        </div>
                    {:else if myBots.length === 0}
                        <div
                            class="col-span-2 sm:col-span-2 lg:col-span-4 flex items-center justify-center p-4"
                        >
                            <span class="p-4 text-center text-zinc-400">
                                You have no chatbots yet
                                <a
                                    href="/new"
                                    class="text-white underline text-center"
                                    >Create one!</a
                                >
                            </span>
                        </div>
                    {/if}
                    {#each myBots as bot}
                        <div
                            class="bg-zinc-800/30 rounded-xl p-4 sm:p-6 transition-all duration-200 hover:bg-zinc-900/30 cursor-pointer border-2 border-white/20"
                        >
                            <h3
                                class="text-xl sm:text-2xl font-bold text-white mb-2"
                            >
                                {bot.name}
                            </h3>
                            <p class="text-zinc-400 text-xs sm:text-sm">
                                {bot.description}
                            </p>
                            <div
                                class="flex items-center justify-between mt-4 sm:mt-8"
                            >
                                <a
                                    href={`/chat/${bot.name}`}
                                    class="text-center bg-white font-bold text-black rounded-xl p-3 sm:p-4 cursor-pointer w-full h-fit hover:transform hover:-translate-y-1 hover:shadow-lg hover:shadow-white/20 transition-all duration-200 block text-sm sm:text-base"
                                >
                                    chat with <span
                                        class="underline decoration-2 underline-offset-4"
                                        >{bot.name}</span
                                    >
                                </a>
                            </div>
                        </div>
                    {/each}
                </div>
            </section>

            <div class="h-px bg-zinc-700 my-6 sm:my-8"></div>
            <section class="mb-12">
                <h2 class="text-2xl sm:text-3xl font-bold text-white mb-4 px-2">
                    Last Chated With
                </h2>
                <div
                    class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6"
                >
                    {#if loading}
                        <div
                            class="col-span-2 sm:col-span-2 lg:col-span-4 flex items-center justify-center p-4"
                        >
                            <div
                                class="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"
                            ></div>
                        </div>
                    {:else if lastchated === []}
                        <div
                            class="col-span-2 sm:col-span-2 lg:col-span-4 flex items-center justify-center p-4"
                        >
                            <span class="p-4 text-center text-zinc-400">
                                You havent chated with any chatbots yet
                            </span>
                        </div>
                    {/if}
                    {#each lastchated as bot}
                        <div
                            class="bg-zinc-800/30 rounded-xl p-4 sm:p-6 transition-all duration-200 hover:bg-zinc-900/30 cursor-pointer border-2 border-white/20"
                        >
                            <h3
                                class="text-xl sm:text-2xl font-bold text-white mb-2"
                            >
                                {bot.name}
                                <span
                                    class="block text-xs sm:text-sm text-zinc-400 font-medium mt-1"
                                >
                                    by {bot.creator}
                                </span>
                            </h3>
                            <p class="text-zinc-400 text-xs sm:text-sm">
                                {bot.description}
                            </p>
                            <a
                                href={`/chat/${bot.name}`}
                                class="text-center bg-white font-bold text-black rounded-xl p-3 sm:p-4 cursor-pointer w-full h-fit mt-4 sm:mt-8 hover:transform hover:-translate-y-1 hover:shadow-lg hover:shadow-white/20 transition-all duration-200 block text-sm sm:text-base"
                            >
                                chat with <span
                                    class="underline decoration-2 underline-offset-4"
                                    >{bot.name}</span
                                >
                            </a>
                        </div>
                    {/each}
                </div>
            </section>
            <div class="h-px bg-zinc-700 my-6 sm:my-8"></div>
            <section class="mb-12">
                <h2 class="text-2xl sm:text-3xl font-bold text-white mb-4 px-2">
                    Random
                </h2>
                <div
                    class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6"
                >
                    {#if loading}
                        <div
                            class="col-span-2 sm:col-span-2 lg:col-span-4 flex items-center justify-center p-4"
                        >
                            <div
                                class="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"
                            ></div>
                        </div>
                    {/if}
                    {#each randomBots as bot}
                        <div
                            class="bg-zinc-800/30 rounded-xl p-4 sm:p-6 transition-all duration-200 hover:bg-zinc-900/30 cursor-pointer border-2 border-white/20"
                        >
                            <h3
                                class="text-xl sm:text-2xl font-bold text-white mb-2"
                            >
                                {bot.name}
                                <span
                                    class="block text-xs sm:text-sm text-zinc-400 font-medium mt-1"
                                >
                                    by {bot.creator}
                                </span>
                            </h3>
                            <p class="text-zinc-400 text-xs sm:text-sm">
                                {bot.description}
                            </p>
                            <a
                                href={`/chat/${bot.name}`}
                                class="text-center bg-white font-bold text-black rounded-xl p-3 sm:p-4 cursor-pointer w-full h-fit mt-4 sm:mt-8 hover:transform hover:-translate-y-1 hover:shadow-lg hover:shadow-white/20 transition-all duration-200 block text-sm sm:text-base"
                            >
                                chat with <span
                                    class="underline decoration-2 underline-offset-4"
                                    >{bot.name}</span
                                >
                            </a>
                        </div>
                    {/each}
                </div>
            </section>
        </div>
    </div>
{/if}
