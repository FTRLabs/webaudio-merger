export class SomeAudioContext {
  foo = 'bar'
}

export const AUDIO_CONTEXT_PROVIDER =
  {
    provide: AudioContext,
    // provide: SomeAudioContext,
    // Webkit/blink browsers need prefix, Safari won't work without window.
    useFactory: () => {
      console.log(`--> newing up AudioContext using factory`)
      return new ((<any>window).AudioContext || (<any>window).webkitAudioContext)()
    }
}
