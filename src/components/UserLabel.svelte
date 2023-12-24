<script lang="ts">
  import {onMount} from 'svelte'
  import {nip19} from 'nostr-tools'

  import {getMetadata, type Metadata} from '../lib/nostr.ts'

  export let pubkey: string
  export let imgClass: string = ''
  let metadata: Metadata
  let npub = nip19.npubEncode(pubkey)

  $: name =
    metadata?.name && metadata.name.trim() !== ''
      ? metadata.name
      : npub.slice(0, 11)
  $: picture = metadata?.picture

  onMount(async () => {
    metadata = await getMetadata(pubkey)
  })
</script>

<div class="flex">
  <div class="flex items-center justify-end rounded-lg">
      <img class="h-[40px] w-[40px] rounded-full overflow-hidden m-2" src={picture || 'defaultAvatar.jpg'}  alt="user avatar" />&nbsp;
  </div>
  <!-- <div
    class="text-ellipsis overflow-hidden text-rose-700 text-lg pl-1"
    title={npub}
  >
    {name}
  </div> -->
</div>
