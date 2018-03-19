# HTML5 WebAudio merger

Just a prototype. Quick sample code on how to use WebAudio to merge multiple audio files.

## Known issues
- [ ] On Chrome Android, may crash after a few seeks with "Aw Snap", or killed browser 
- [ ] Does not handle fast successive seeking to different locations. This can lead to:
  - [ ] multiple parts of the recording playing simultaneously
  - [ ] error in console "Cannot start chunk before loaded", or "Error decoding audio data for chunk"
- [ ] Does not support Safari (should just need webkit prefix monkey patch or equivalent)
- [ ] Downloads all (encoded) data up front - should be lazy/buffered
- [ ] Does not calculate/indicate current location in recording
- [ ] Requires server to provide: a list of around 1 min AAC files (seems more stable and faster than 5 min chunks) with corresponding durations 
- [ ] All channels are played with identical [spatialization](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Web_audio_spatialization_basics), which limits clarity. Should at least use stereo.

## Running locally

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.7.3.

Requires node v6.11.2 (indirectly required by `angular-audio-context` dependency).

Generate an SSL cert-key pair (or use an existing one if you prefer):
```
openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out certificate.pem

# Add localhost as a CA - will only work on Chrome
certutil -d sql:$HOME/.pki/nssdb -A -t "CT,C,C" -n certificate.pem -i certificate.pem
```

Extract the AAC files from [this sample recording](https://drive.google.com/open?id=1E6lWt9ol-cysOIEXU9t22wNfRgTag_4c) directly to the root of the directory `./src/assets/audio`, then split them into 60 second chunks as follows:
```
cd ./src/assets
./split.sh 60
``` 

Run the following for a dev server:
```
ng serve --open --ssl 1 --ssl-cert certificate.pem --ssl-key key.pem
```
Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
