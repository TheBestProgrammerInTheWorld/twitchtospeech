<script>
    import { onMount, onDestroy } from 'svelte';
    
    let channel = '';
    let messages = [];
    let eventSource;

    async function connectToChannel() {
        try {
            // Connect to the channel
            const response = await fetch('http://localhost:3000/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ channel })
            });

            if (!response.ok) {
                throw new Error('Failed to connect to channel');
            }

            // Start listening for messages
            eventSource = new EventSource('http://localhost:3000/chat-stream');
            
            eventSource.onmessage = (event) => {
                const chatMessage = JSON.parse(event.data);
                messages = [...messages, chatMessage];
            };

            eventSource.onerror = (error) => {
                console.error('EventSource failed:', error);
            };

        } catch (error) {
            console.error('Error:', error);
            alert('Failed to connect to channel');
        }
    }

    onDestroy(() => {
        if (eventSource) {
            eventSource.close();
        }
    });
</script>

<div class="container mx-auto p-4">
    <div class="mb-4">
        <input
            type="text"
            bind:value={channel}
            placeholder="Enter channel name"
            class="border p-2 rounded"
        />
        <button
            on:click={connectToChannel}
            class="bg-purple-600 text-white px-4 py-2 rounded ml-2"
        >
            Connect
        </button>
    </div>

    <div class="chat-container h-[500px] overflow-y-auto border rounded p-4">
        {#each messages as msg}
            <div class="message mb-2">
                <span class="font-bold">{msg.username}:</span>
                <span>{msg.message}</span>
            </div>
        {/each}
    </div>
</div>

<style>
    .chat-container {
        background-color: #f8f9fa;
    }
    
    .message {
        padding: 0.5rem;
        border-radius: 0.25rem;
        background-color: white;
    }
</style>

