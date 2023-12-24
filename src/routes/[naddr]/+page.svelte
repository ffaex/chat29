<script lang="ts">
  import type {Event} from 'nostr-tools/pure'
  import type {AbstractRelay, Subscription} from 'nostr-tools/abstract-relay'
  import * as nip19 from 'nostr-tools/nip19'
  import {onMount} from 'svelte'
  import {debounce} from 'debounce'

  import {afterNavigate} from '$app/navigation'
  import {page} from '$app/stores'
  import {pool, publish} from '../../lib/nostr.ts'
  import {humanDate} from '../../lib/utils.ts'
  import UserLabel from '../../components/UserLabel.svelte'
  import Header from '../../components/Header.svelte'
    import Message from '../../components/Message.svelte'

  let naddr = $page.params.naddr
  let groupId: string | null = null
  let messages: Event[] = []
  let text = localStorage.getItem('text') || ''
  let readOnly = false
  let controlIsDown = false
  let groupMetadata: {
    name: string | null
    picture: string | null
    about: string
  } = {
    name: null,
    picture: null,
    about: ''
  }
  let info: {pubkey: string; name: string; description: string; icon: string}
  let relay: AbstractRelay
  let sub: Subscription
  let error: string
  let eoseHappened = false

  $: groupRawName = relay ? `${groupId}@${new URL(relay.url).host}` : ''

  const updateMessages = debounce(() => {
    messages = messages
    scrollToEnd()
  }, 300)

  const saveToLocalStorage = debounce(() => {
    localStorage.setItem('text', text)
  }, 2000)

  function scrollToEnd() {
    setTimeout(() => {
      document
        .getElementById(`evt-${messages[messages.length - 1].id.substring(-6)}`)
        ?.scrollIntoView()
    }, 25)
  }

  onMount(() => {
    loadChat()
    return unloadChat
  })

  afterNavigate(() => {
    if (naddr === $page.params.naddr) return
    unloadChat()
    loadChat()
  })

  function unloadChat() {
    if (sub) sub.close()
    eoseHappened = false
    messages = []
    groupMetadata = {name: null, picture: null, about: ''}
    groupId = null
  }

  async function loadChat() {
    naddr = $page.params.naddr

    try {
      let {data, type} = nip19.decode(naddr)
      if (type !== 'naddr') return

      let {relays, identifier} = data as nip19.AddressPointer
      if (!relays || relays.length === 0) return

      let relayUrl = relays![0]
      groupId = identifier

      relay = await pool.ensureRelay(relayUrl)
      info = await fetch(relayUrl.replace('ws', 'http'), {
        headers: {accept: 'application/nostr+json'}
      }).then(r => r.json())

      sub = relay.subscribe(
        [
          {kinds: [9], '#h': [groupId], limit: 700},
          {kinds: [39000], '#d': [groupId]}
        ],
        {
          onevent(event) {
            switch (event.kind) {
              case 39000:
                event.tags.forEach(tag => {
                  switch (tag[0]) {
                    case 'name':
                      if (tag[1] && tag[1].trim().length > 0)
                        groupMetadata.name = tag[1].trim()
                    case 'picture':
                      if (tag[1]) groupMetadata.picture = tag[1]
                    case 'about':
                      if (tag[1]) groupMetadata.picture = tag[1]
                  }
                })
                break
              case 9:
                messages.push(event as any)
                if (eoseHappened) updateMessages()
                break
            }
          },
          oneose() {
            messages = messages.reverse()
            scrollToEnd()
            eoseHappened = true
          },
          onclose(reason) {
            console.warn(relay.url, 'relay connection closed', reason)
          }
        }
      )
    } catch (err: any) {
      error = err.message
    }
  }

  async function sendMessage() {
    try {
      readOnly = true
      await publish(
        {
          kind: 9,
          content: text,
          tags: [['h', groupId!]],
          created_at: Math.round(Date.now() / 1000)
        },
        [relay.url]
      )
      text = ''
      saveToLocalStorage()
      readOnly = false
    } catch (err) {
      console.log('failed to send', err)
    }
  }

  function onKeyDown(ev: KeyboardEvent) {
    if (ev.repeat) return
    switch (ev.key) {
      case 'Control':
        controlIsDown = true
        ev.preventDefault()
    }
  }

  function onKeyUp(ev: KeyboardEvent) {
    switch (ev.key) {
      case 'Control':
        controlIsDown = false
        ev.preventDefault()
      case 'Enter':
        if (controlIsDown) sendMessage()
        ev.preventDefault()
    }
  }
</script>

<svelte:window on:keydown={onKeyDown} on:keyup={onKeyUp} />

<style>
  /* Hide scrollbar for Chrome, Safari and Opera */
.hideBar::-webkit-scrollbar {
display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.hideBar {
-ms-overflow-style: none;  /* IE and Edge */
scrollbar-width: none;  /* Firefox */
}

</style>

<header class="pb-8 h-1/6">
  <div><Header /></div>
  <div class="flex items-center">
    <div class="text-sm w-1/12 text-right">room</div>
    <div
      class="text-emerald-600 text-lg mx-4 w-8/12 overflow-hidden text-ellipsis"
    >
      {groupMetadata.name || groupRawName || $page.params.naddr}
    </div>
    <div class="text-xs text-white w-3/12 text-right">{groupRawName}</div>
  </div>
</header>
{#if error}
  <section class="w-full flex justify-center items-center h-4/5 text-xl">
    {error}
  </section>
{:else}
<div class="h-5/6 flex">
  <div>
    Groups will be here
  </div>
  <div class="h-full grow">
    <section class="row-span-9 overflow-y-auto h-5/6 hideBar">
      <div class="flex flex-col mx-auto w-5/6">
        <div class="h-full overflow-auto flex-col space-y-4">
          {#each messages as message}
            <Message {message} {groupId} {relay}/>
          {/each}
        </div>
      </div>
    </section>
    <section class="h-1/6 w-5/6 mx-auto">
      <div class="h-3/4">
        <form
        on:submit={sendMessage}
        class="flex gap-2 pt-4 mb-2 h-full py-4"
      >
        <textarea
          class="h-full w-full bg-slate-400 rounded-lg p-2 text-black"
          placeholder="type a message here (and use Ctrl+Enter to send)"
          bind:value={text}
          on:input={saveToLocalStorage}
          readonly={readOnly}
        />
        <div class="">
          <button
            class="h-full w-full py-4 px-7 bg-primary-1100 text-white hover:bg-primary-1200 transition-colors rounded-xl flex items-center justify-center"
            disabled={readOnly || !groupId || !relay}
          >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
          </svg>
          
          </button>
        </div>
      </form>
      </div>
    </section>  
  </div>
</div>
{/if}
