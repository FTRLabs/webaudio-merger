# HTML5 WebAudio merger

Just a prototype. Quick sample code on how to use WebAudio to merge multiple audio files.

> Music provided by: [BESOUND](http://www.bensound.com/ "BESOUND homepage")

## Running locally

Generate an SSL cert-key pair (or use an existing one if you prefer):
```
openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out certificate.pem

# Add localhost as a CA - will only work on Chrome
certutil -d sql:$HOME/.pki/nssdb -A -t "CT,C,C" -n certificate.pem -i certificate.pem
```

Extract the TRM files in [this sample recording](https://drive.google.com/open?id=1E6lWt9ol-cysOIEXU9t22wNfRgTag_4c) directly to the root of the directory `./audio`.

Build and run:

```
yarn
yarn dev
``` 

Browse to:
```
https://localhost:8080
```
