<script lang="ts">
    import {onDestroy, onMount} from 'svelte'
    import {nip19} from 'nostr-tools'
    import type { AbstractRelay, Event } from 'nostr-tools'
    import UserLabel from './UserLabel.svelte'
    import { getUserColor, humanDate } from '$lib/utils.ts'
    import { getMetadata, publish, type Metadata } from '$lib/nostr.ts'
    import clsx from 'clsx';
    import {account} from '../lib/nostr.ts';


    export let message: Event;
    export let groupId: string | null;
    export let relay : AbstractRelay;
    let metadata: Metadata
    let npub = nip19.npubEncode(message.pubkey)

  $: name =
    metadata?.name && metadata.name.trim() !== ''
      ? metadata.name
      : npub.slice(0, 11)
  $: picture = metadata?.picture

  onMount(async () => {
    metadata = await getMetadata(message.pubkey)
  })
  let ownMessage = message.pubkey === $account?.pubkey;
  ownMessage = message.content === "it's not"; //TODO remove this

  let showDropdown = false;

  let dropdownButton: SVGSVGElement;

function toggleDropdown() {
  showDropdown = !showDropdown;
}

// Close dropdown when clicked outside
function handleClickOutside(event :any) {
  if (dropdownButton && !dropdownButton.contains(event.target)) {
    showDropdown = false;
  }
}

window.addEventListener('click', handleClickOutside);

onDestroy(() => {
  window.removeEventListener('click', handleClickOutside);
});
async function deleteMessage() {
    try {
      await publish(
        {
          kind: 9005,
          content: "",
          tags: [['h', groupId!], ['e', message.id]],
          created_at: Math.round(Date.now() / 1000)
        },
        [relay.url]
      )
    } catch (err) {
      console.log('failed to send', err)
    }
  }

</script>  

<style>
.speech-bubble {
	position: relative;
	background: #27496D;
	border-radius: .6em;
}

.arrowLeft {
	content: '';
	position: absolute;
	bottom: 10px;
    left: 0px;
	width: 0;
	height: 0;
	border: 7px solid transparent;
	border-right-color: #27496D;
	border-left: 0;
	margin-top: -7px;
	margin-left: -7px;
}
.arrowRight {
	content: '';
	position: absolute;
	bottom: 10px;
    right: 0px;
	width: 0;
	height: 0;
	border: 7px solid transparent;
	border-left-color: #27496D;
	border-right: 0;
	margin-top: -7px;
	margin-right: -7px;
}

</style>

<!-- message.pubkey === $account?.pubkey -->
<div
class="{ownMessage ? clsx("flex-row-reverse ") : ""}flex items-end"
id={`evt-${message.id.substring(-6)}`}
>
<div class="rounded-lg">
  <UserLabel imgClass="max-h-20 max-w-20 p-2 rounded-lg overflow-hidden" pubkey={message.pubkey} />
</div>
<div class="text-white flex-grow-0 max-w-[33%] p-2 speech-bubble group"> 
    <div class="{ ownMessage ? clsx("arrowRight") : clsx("arrowLeft")}">
    </div>
  <div class="flex justify-between relative">
    <div style="color:{getUserColor(groupId ? groupId : "default", message.pubkey)}" class="text-sm">{name}</div>
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <svg bind:this={dropdownButton} on:click={toggleDropdown} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-6 w-6 invisible group-hover:visible">
        <path fill-rule="evenodd" d="M4.5 12a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" clip-rule="evenodd" />
    </svg>
    {#if showDropdown}
    <div class="origin-top-right absolute {ownMessage ? clsx("right-full") : clsx("left-full")} top-0 ml-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
      <div class="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
        <div class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Edit</div> 
        <div tabindex="0" on:click={() => deleteMessage()} class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Delete</div>
      </div>
    </div>
  {/if}


  </div>



  
  <div class="w-full h-full">{message.content}</div>
</div>

<!-- <div
  class="text-white text-xs"
  title={new Date(message.created_at * 1000).toString()}>
  {humanDate(message.created_at)}
</div> -->
</div>