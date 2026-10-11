/*
  Teachable Sorter — sketch per la scheda (Leonardo, Micro, Uno, Nano, ...)

  Versione dello sketch originale di Tiny Sorter adattata alla porta seriale
  normale (USB) al posto di WebUSB. Il browser parla con la scheda tramite la
  Web Serial API, quindi NON serve la libreria WebUSB e non va ridefinito
  `Serial`. Serve solo la libreria Servo, inclusa in Arduino IDE.

  Meccanica identica all'originale:
    - da fermo il servo vibra tra IDLE_MIN e IDLE_MAX per far scendere l'oggetto
    - classe "sinistra": scatto a LEFT_POS, pausa, ritorno lento a REST
    - classe "destra":   scatto a RIGHT_POS, pausa, ritorno lento a REST

  Protocollo: il browser invia una riga di testo per ogni evento.
    "start\n" -> il sorter parte: il servo inizia a vibrare da fermo
    "stop\n"  -> il sorter si ferma: servo a riposo
    "0\n"     -> SINISTRA (es. cereali)
    "1\n"     -> DESTRA   (es. marshmallow)
    altro     -> ignorato (es. classe "vuoto")
  Finche' non arriva "start" il servo resta fermo a REST (i bottoni Prova del
  browser lo muovono comunque).
  I comandi associati alle classi si cambiano nel browser, tabella
  "Regole di invio". La scheda risponde "READY" quando il browser apre la
  porta e "OK <comando>" a ogni riga ricevuta.

  Collegamenti: servo segnale -> pin 9, rosso -> 5V, marrone/nero -> GND.
*/

#include <Servo.h>

const int SERVO_PIN = 9;

const int REST = 75;        // posizione di riposo

// Vibrazione mentre il sorter e' avviato (come nel Tiny Sorter originale):
// scuote lo scivolo per far scendere gli oggetti uno alla volta. Metti false
// per tenere il servo fermo a REST anche durante il funzionamento.
const bool IDLE_SHAKE = true;
const int IDLE_MIN = 60;    // vibrazione da fermo: estremo basso
const int IDLE_MAX = 90;    // vibrazione da fermo: estremo alto
const int IDLE_STEP_MS = 3; // piu' alto = vibrazione piu' lenta e dolce
const int LEFT_POS = 0;     // scatto verso sinistra
const int RIGHT_POS = 180;  // scatto verso destra

const unsigned long HOLD_MS = 2000;   // quanto resta nella posizione di scarico
const unsigned long SETTLE_MS = 1000; // pausa dopo il ritorno, prima di ripartire

Servo servo;
bool announced = false;
bool running = false;  // true tra "start" e "stop"

void setup() {
  Serial.begin(9600);
  Serial.setTimeout(50);
  pinMode(LED_BUILTIN, OUTPUT);
  servo.attach(SERVO_PIN);

  // Autotest all'accensione: se il servo non fa questo movimento il problema
  // e' nel cablaggio o nell'alimentazione, non nel browser.
  servo.write(LEFT_POS);
  delay(500);
  servo.write(RIGHT_POS);
  delay(500);
  servo.write(REST);
  delay(300);
}

// Scatto verso `target`, pausa, poi ritorno graduale a REST.
void sortTo(int target, const char* label) {
  digitalWrite(LED_BUILTIN, HIGH);
  servo.write(target);
  delay(HOLD_MS);

  int step = (target < REST) ? 1 : -1;
  for (int pos = target; pos != REST; pos += step) {
    servo.write(pos);
    delay(8);
  }
  servo.write(REST);
  delay(SETTLE_MS);

  digitalWrite(LED_BUILTIN, LOW);
  Serial.println(label);
}

void loop() {
  // Su Leonardo/Micro `Serial` diventa vero solo quando il browser apre la
  // porta: annunciamo READY in quel momento. Su Uno/Nano e' sempre vero e
  // READY parte subito dopo il reset che segue l'apertura della porta.
  if (Serial && !announced) {
    Serial.println("READY");
    announced = true;
  } else if (!Serial) {
    // Browser scollegato: ci fermiamo in sicurezza.
    announced = false;
    running = false;
  }

  if (Serial.available()) {
    String line = Serial.readStringUntil('\n');
    line.trim();
    if (line.length() > 0) {
      Serial.print("OK ");
      Serial.println(line);

      if (line == "start") {
        running = true;
        Serial.println("START");
      } else if (line == "stop") {
        running = false;
        servo.write(REST);
        Serial.println("STOP");
      } else if (line == "0") {
        sortTo(LEFT_POS, "sinistra");
      } else if (line == "1") {
        sortTo(RIGHT_POS, "destra");
      }
      // qualsiasi altro comando (es. la classe "vuoto") non muove nulla
    }
    // Scarta i comandi arrivati mentre il servo era in movimento, cosi' non
    // si accumulano scatti in ritardo.
    while (Serial.available()) {
      Serial.read();
    }
    return;
  }

  // Nessun comando. Fermo finche' il sorter non e' avviato.
  if (!running || !IDLE_SHAKE) {
    servo.write(REST);
    delay(20);
    return;
  }
  for (int pos = IDLE_MIN; pos <= IDLE_MAX; pos++) {
    servo.write(pos);
    delay(IDLE_STEP_MS);
  }
  for (int pos = IDLE_MAX; pos >= IDLE_MIN; pos--) {
    servo.write(pos);
    delay(IDLE_STEP_MS);
  }
}
