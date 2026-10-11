/*
  Teachable Sorter — sketch Arduino

  Riceve dalla seriale (9600 baud) una riga per ogni classe riconosciuta dal
  browser. Per default il browser invia l'indice della classe seguito da newline:
      "0\n"  -> prima classe
      "1\n"  -> seconda classe
      ...

  Questo esempio replica il comportamento di Tiny Sorter: un servo che spinge
  l'oggetto a sinistra per la classe 0, a destra per la classe 1 e "vibra" per
  scuotere gli oggetti quando non riconosce nulla (se dal browser mandi un
  comando per "nessuna classe", ad es. "-1").

  Collegamenti:
    - servo: segnale sul pin 9, VCC a 5V, GND a GND
    - LED integrato (pin 13) come feedback

  Nel browser puoi cambiare il comando associato a ogni classe nella tabella
  "Regole di invio", quindi puoi usare lettere o parole al posto dei numeri:
  basta adattare la switch qui sotto.
*/

#include <Servo.h>

const int SERVO_PIN = 9;
const int CENTER = 90;     // posizione di riposo
const int LEFT = 40;       // posizione per la classe 0
const int RIGHT = 140;     // posizione per la classe 1
const int WIGGLE = 8;      // ampiezza della vibrazione
const unsigned long HOLD_MS = 600;  // quanto tenere la posizione

Servo servo;

void setup() {
  Serial.begin(9600);
  pinMode(LED_BUILTIN, OUTPUT);
  servo.attach(SERVO_PIN);
  servo.write(CENTER);
  Serial.println("READY");
}

void moveTo(int angle) {
  digitalWrite(LED_BUILTIN, HIGH);
  servo.write(angle);
  delay(HOLD_MS);
  servo.write(CENTER);
  digitalWrite(LED_BUILTIN, LOW);
}

void wiggle() {
  for (int i = 0; i < 4; i++) {
    servo.write(CENTER + WIGGLE);
    delay(60);
    servo.write(CENTER - WIGGLE);
    delay(60);
  }
  servo.write(CENTER);
}

void loop() {
  if (Serial.available() == 0) return;

  String line = Serial.readStringUntil('\n');
  line.trim();
  if (line.length() == 0) return;

  int cls = line.toInt();  // "0" -> 0, "1" -> 1, testo non numerico -> 0

  // Risposta di conferma: compare nel Monitor seriale del browser
  Serial.print("OK ");
  Serial.println(line);

  if (line == "-1") {
    wiggle();
    return;
  }

  switch (cls) {
    case 0:
      moveTo(LEFT);
      break;
    case 1:
      moveTo(RIGHT);
      break;
    default:
      // classi oltre la seconda: aggiungi qui altri case
      wiggle();
      break;
  }
}
