<script>
    import { scale } from "svelte/transition";
    import { onMount } from "svelte";
    import supabase from "$lib/supabase";
    import groq from "$lib/groq";
    import { page } from "$app/stores";
    import {goto } from "$app/navigation"

    let messages = $state([]);
    let newMessage = $state("");
    let showDetails = $state(false);

    let botCreator = $state("Unknown Creator");
    let botName = $page.params.bot;
    let botDescription = $state("Unknown Description");
    let botBehavior = $state("Unknown Behavior");
    let botRelationship = $state("Unknown Relationship");

    let chatContainer;

    let loadingChats = $state(true)

    onMount(async () => {
        let { data, error } = await supabase
            .from("chat_bots")
            .select("*")
            .eq("name", botName);

        if (error) {
            console.error(error);
        } else {
            botCreator = data[0].creator;
            botDescription = data[0].description;
            botBehavior = data[0].behavior;
            botRelationship = data[0].relationship;
        }

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (user.user_metadata?.messages?.[botName]) {
            messages = user.user_metadata?.messages?.[botName];
        }
        loadingChats = false
    });
    async function handleSubmit(e) {
        e.preventDefault();
        let temp = newMessage;
        newMessage = "";
        messages = [
            ...messages,
            { content: temp, role: "user", timestamp: new Date() },
        ];

        let filteredHistory = messages.map(
            ({ ["timestamp"]: _, ...rest }) => rest,
        );
        let res = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",

                    content: `your a person named ${botName}, with the following personality: ${botDescription}, your chatting with the user, your relationship with the user is: ${botRelationship}, act and respond in character `,
                },

                ...filteredHistory,
            ],

            model: "llama-3.3-70b-versatile",

            temperature: 0.5,
        });
        let data = res.choices[0].message.content;

        messages = [
            ...messages,
            { content: data, role: "assistant", timestamp: new Date() },
        ];
    }

    async function back() {
        let temp = {};
        temp[botName] = messages;
        const { data, error } = await supabase.auth.updateUser({
            data: {
                messages: {
                    ...temp,
                },
            },
        });
        goto("/chats");
    }
</script>

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
                <button
                    onclick={back}
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
                </button>
            </div>
            <div class="text-center flex-1">
                <h1 class="text-2xl font-bold text-white">{botName}</h1>
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
                class="bg-zinc-900 border-2 border-white/20 rounded-xl p-8 max-w-md w-full mx-4"
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
                        <h3 class="text-zinc-400 text-sm">Personality</h3>
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
            </div>
        </div>
    {/if}

    <!-- Chat Messages -->
    <div class="flex-1 overflow-y-auto p-4" bind:this={chatContainer}>
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
                    onoutroend={() => {
                        chatContainer?.scrollTo(0, chatContainer.scrollHeight);
                    }}
                >
                    <div
                        class="max-w-[80%] {message.role === 'user'
                            ? 'bg-white'
                            : 'bg-zinc-800/30'} rounded-xl p-4 border-2 border-white/20"
                    >
                        <p
                            class="{message.role === 'user'
                                ? 'text-black'
                                : 'text-white'} font-medium"
                        >
                            {message.content}
                        </p>
                        <p class="text-xs text-zinc-400 mt-1">
                            {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                    </div>
                </div>
            {/each}
        </div>
    </div>

    <!-- Message Input -->
    <div
        class="fixed bottom-0 left-0 right-0 bg-zinc-900/80 backdrop-blur-sm p-4 border-t-2 border-white/20"
    >
        <div class="max-w-3xl mx-auto">
            <form onsubmit={handleSubmit} class="flex gap-4">
                <input
                    type="text"
                    bind:value={newMessage}
                    placeholder="Type your message..."
                    class="flex-1 bg-zinc-900/50 border-2 border-white/20 rounded-xl px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 shadow-lg"
                />
                <button
                    type="submit"
                    class="bg-white font-bold text-black px-6 py-2 rounded-xl font-medium transition-colors hover:bg-zinc-200"
                >
                    Send
                </button>
            </form>
        </div>
    </div>
</div>
