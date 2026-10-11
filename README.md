# Teachable Sorter

Rifacimento di [Tiny Sorter](https://experiments.withgoogle.com/tiny-sorter/view/) con uno stack
che non si rompe: incolli il link di un modello di
[Teachable Machine](https://teachablemachine.withgoogle.com/), accendi la webcam e il browser manda
i comandi all'Arduino via **Web Serial**, senza app intermedie né p5.serialcontrol.

Tutto gira nel browser (Chrome, Edge o Opera su computer). Nessun server, nessun dato che lascia il
PC.

```
src/
  App.tsx              stato dell'app e loop di classificazione
  lib/teachable.ts     carica model.json + metadata.json con TensorFlow.js 4
  lib/serial.ts        wrapper sulla Web Serial API
  hooks/useCamera.ts   webcam
  components/          interfaccia (3 passi, live, riconoscimento, regole, monitor seriale)
arduino/sorter/        sketch per la scheda (servo sul pin 9)
.github/workflows/     deploy automatico su GitHub Pages
```

## Sviluppo

```bash
npm install
npm run dev        # http://localhost:8090
npm run build      # typecheck + bundle in dist/
```

## Come si usa

1. **Modello**: su Teachable Machine, *Esporta modello → Tensorflow.js → Carica il modello* e
   incolla il link (`https://teachablemachine.withgoogle.com/models/XXXX/`).
2. **Arduino**: carica `arduino/sorter/sorter.ino` sulla scheda, poi *Collega Arduino* e scegli la
   porta nella finestra del browser.
3. **Webcam**: accendila. Il riconoscimento parte da solo.

Per ogni classe il browser invia una riga sulla seriale (default: l'indice della classe, `0\n`,
`1\n`, …). Nella sezione *Regole di invio* puoi cambiare soglia, anti-sfarfallio, modalità di invio
e il comando associato a ogni classe. Il *Monitor seriale* mostra ciò che parte e ciò che l'Arduino
risponde.

## Pubblicazione su GitHub Pages

1. Crea un repository su GitHub e fai il push di `main`.
2. Nelle impostazioni del repository: *Settings → Pages → Source: GitHub Actions*.
3. Ad ogni push su `main` il workflow pubblica il sito su `https://<utente>.github.io/<repo>/`.

Web Serial e la webcam richiedono HTTPS: GitHub Pages lo fornisce di default.

## Perché non la libreria ufficiale `@teachablemachine/image`

È ferma a TensorFlow.js 1.3.1 (2019). `src/lib/teachable.ts` replica la sua pipeline (crop
centrale, resize a 224, normalizzazione `pixel/127 - 1`) con TensorFlow.js 4, quindi i risultati
sono gli stessi ma senza dipendenze vecchie.
