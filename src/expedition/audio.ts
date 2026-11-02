export class Soundscape {
  enabled = false;
  ctx: AudioContext | null = null;
  bus: GainNode | null = null;
  noise: AudioBuffer | null = null;
  clock = 0;
  footClock = 0;
  buffers = new Map<string, AudioBuffer>();
  variant = 0;
  loading: Promise<void> | null = null;
  set(on: boolean) {
    this.enabled = on;
    if (!on) {
      void this.ctx?.suspend();
      return;
    }
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.bus = this.ctx.createGain();
      this.bus.gain.value = 0.18;
      const compressor = this.ctx.createDynamicsCompressor();
      this.bus.connect(compressor);
      compressor.connect(this.ctx.destination);
      this.noise = this.ctx.createBuffer(
        1,
        this.ctx.sampleRate * 2,
        this.ctx.sampleRate,
      );
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    void this.ctx.resume();
    if (!this.loading) this.loading = this.load();
  }
  tone(
    f: number,
    end: number,
    duration: number,
    gain = 0.4,
    type: OscillatorType = "sine",
  ) {
    if (!this.enabled || !this.ctx || !this.bus) return;
    const o = this.ctx.createOscillator(),
      g = this.ctx.createGain(),
      t = this.ctx.currentTime;
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(15, end), t + duration);
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    o.connect(g);
    g.connect(this.bus);
    o.start();
    o.stop(t + duration + 0.02);
  }
  hiss(duration: number, frequency: number, gain = 0.4) {
    if (!this.enabled || !this.ctx || !this.bus || !this.noise) return;
    const n = this.ctx.createBufferSource(),
      f = this.ctx.createBiquadFilter(),
      g = this.ctx.createGain(),
      t = this.ctx.currentTime;
    n.buffer = this.noise;
    f.type = "bandpass";
    f.frequency.value = frequency;
    f.Q.value = 0.7;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    n.connect(f);
    f.connect(g);
    g.connect(this.bus);
    n.start();
    n.stop(t + duration);
  }
  async load() {
    const names = [
      "knifeSlice",
      "knifeSlice2",
      "cloth1",
      "cloth2",
      "metalLatch",
      "metalClick",
      "creak1",
      "footstep_concrete_000",
      "footstep_concrete_001",
      "footstep_concrete_002",
      "impactPunch_heavy_000",
      "impactMetal_heavy_000",
      "impactMining_000",
      "impactBell_heavy_000",
    ];
    await Promise.all(
      names.map(async (name) => {
        try {
          const response = await fetch("/assets/audio/" + name + ".ogg");
          if (!response.ok) return;
          this.buffers.set(
            name,
            await this.ctx!.decodeAudioData(await response.arrayBuffer()),
          );
        } catch {
          /* An optional sound must never interrupt play. */
        }
      }),
    );
  }
  sample(name: string, gain = 0.6, rate = 1) {
    if (!this.enabled || !this.ctx || !this.bus) return;
    const buffer = this.buffers.get(name);
    if (!buffer) return;
    const source = this.ctx.createBufferSource(),
      volume = this.ctx.createGain();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    volume.gain.value = gain;
    source.connect(volume);
    volume.connect(this.bus);
    source.start();
    source.onended = () => {
      source.disconnect();
      volume.disconnect();
    };
  }
  play(event: string) {
    if (!this.enabled) return;
    const variation = (this.variant++ % 3) * 0.045;
    if (event === "swing")
      this.sample(
        this.variant % 2 ? "knifeSlice" : "knifeSlice2",
        0.75,
        1 + variation,
      );
    else if (event === "kick") this.sample("cloth2", 0.6, 1.3);
    else if (event === "hit")
      this.sample("impactPunch_heavy_000", 0.7, 1 + variation);
    else if (["slam", "explode", "burst", "crane-impact"].includes(event)) {
      this.sample("impactMining_000", 0.9, 0.72);
      this.tone(70, 25, 0.38, 0.3);
    } else if (event === "hurt")
      this.sample("impactPunch_heavy_000", 0.55, 0.8);
    else if (event === "grapple") {
      this.sample("metalLatch", 0.7);
      this.sample("cloth2", 0.4, 0.8);
    } else if (event === "cast") this.sample("knifeSlice2", 0.7, 0.7);
    else if (event === "dodge")
      this.sample(this.variant % 2 ? "cloth1" : "cloth2", 0.7, 1.2);
    else if (["secured", "secret"].includes(event))
      this.sample("impactBell_heavy_000", 0.4, 1.3);
    else if (["device", "armour"].includes(event))
      this.sample("metalClick", 0.75, 0.85);
    else if (event === "heal")
      for (const f of [220, 330, 440]) this.tone(f, f, 0.8, 0.08);
    else if (event === "crane-release") {
      this.sample("metalLatch", 0.8, 0.7);
      this.sample("creak1", 0.65, 0.6);
    } else if (event === "tell") this.sample("creak1", 0.3, 0.6);
    else if (event === "land") this.sample("footstep_concrete_002", 0.9, 0.7);
  }
  update(dt: number, moving: boolean, combat: boolean) {
    if (!this.enabled) return;
    this.clock += dt;
    this.footClock += dt;
    if (moving && this.footClock > 0.29) {
      this.footClock = 0;
      this.sample(
        "footstep_concrete_00" + (this.variant++ % 3),
        0.36,
        1 + (this.variant % 3) * 0.04,
      );
    }
    if (this.clock > (combat ? 1.2 : 5)) {
      this.clock = 0;
      this.tone(55, 55, combat ? 1 : 5, 0.025, "sine");
      if (combat) this.tone(45, 28, 0.18, 0.08);
    }
  }
}
