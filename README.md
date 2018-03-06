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

Build and run:

```
yarn
yarn build
yarn dev
``` 

Browse to:
```
https://localhost:9000
```