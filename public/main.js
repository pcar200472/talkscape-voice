let ws, audioCtx, source, processor, mediaStream;

const $ = (id) => document.getElementById(id);
const statusEl = $("status");
const captionsEl = $("captions");
const asrEl = $("asr");

$("start").onclick = async () => {
  $("start").disabled = true;
  try {
    // 1) Ask backend for signed ElevenLabs URL
    const res = await fetch("/api/signed-url?first_name=Aroha&topic=current%20needs");
    const { signedUrl } = await res.json();

    // 2) Connect WebSocket
    ws = new WebSocket(signedUrl);
    ws.binaryType = "arraybuffer";

    ws.onopen = async () => {
      statusEl.textContent = "Status: connected";
      $("stop").disabled = false;

      // 3) Microphone capture
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioCtx = new AudioContext();
      source = audioCtx.createMediaStreamSource(mediaStream);

      // Simple audio pipeline; for production use AudioWorklet
      processor = audioCtx.createScriptProcessor(4096, 1, 1);
      source.connect(processor);
      processor.connect(audioCtx.destination);

      processor.onaudioprocess = (e) => {
        if (!ws || ws.readyState !== 1) return;
        const input = e.inputBuffer.getChannelData(0);
        // Float32 → 16-bit PCM (LE)
        const buf = new ArrayBuffer(input.length * 2);
        const view = new DataView(buf);
        for (let i = 0; i < input.length; i++) {
          let s = Math.max(-1, Math.min(1, input[i]));
          view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
        ws.send(buf);
      };
    };

    ws.onmessage = (evt) => {
      try {
        const ev = JSON.parse(evt.data);
        if (ev.type === "agent_caption") {
          captionsEl.textContent = ev.text;
        } else if (ev.type === "user_transcript") {
          asrEl.textContent = ev.text;
        } else if (ev.type === "status") {
          statusEl.textContent = `Status: ${ev.state || ev.text}`;
        }
      } catch {
        // non-JSON frames (e.g., audio chunks) ignored in this minimal demo
      }
    };

    ws.onclose = () => {
      cleanup();
      statusEl.textContent = "Status: disconnected";
    };

    ws.onerror = () => {
      cleanup();
      statusEl.textContent = "Status: error";
      $("start").disabled = false;
    };

  } catch (e) {
    console.error(e);
    $("start").disabled = false;
    statusEl.textContent = "Status: failed to connect";
  }
};

$("stop").onclick = () => {
  if (ws && ws.readyState === 1) ws.close();
  cleanup();
  $("start").disabled = false;
  $("stop").disabled = true;
};

function cleanup() {
  try { processor && processor.disconnect(); } catch {}
  try { source && source.disconnect(); } catch {}
  try { audioCtx && audioCtx.close(); } catch {}
  try { mediaStream && mediaStream.getTracks().forEach(t => t.stop()); } catch {}
  processor = source = audioCtx = undefined;
  captionsEl.textContent = "…";
  asrEl.textContent = "…";
}
