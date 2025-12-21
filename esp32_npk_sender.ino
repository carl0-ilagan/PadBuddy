#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>

// ---------------- WIFI ----------------
#define WIFI_SSID "ZTE_2.4G_cAabzE"
#define WIFI_PASSWORD "JKCh4gdT"

// -------------- FIREBASE --------------
#define DATABASE_URL "https://rice-padbuddy-default-rtdb.asia-southeast1.firebasedatabase.app"
#define DEVICE_ID "DEVICE_0001"

// ---------------- TIMING ----------------
unsigned long lastSend = 0;
const unsigned long interval = 60000; // 1 minute

// ---------------- HEARTBEAT ----------------
unsigned long heartbeatCounter = 0;

void setup() {
  Serial.begin(115200);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");

  // ✅ FIX 1: Configure NTP with Philippines timezone (UTC+8)
  configTime(8 * 3600, 0, "pool.ntp.org", "time.nist.gov");
  
  // ✅ FIX 2: Wait for NTP to sync before sending first reading
  Serial.print("Waiting for NTP sync");
  time_t now = 0;
  while (now < 1700000000) { // Wait until we get a reasonable timestamp (after 2023)
    delay(500);
    Serial.print(".");
    time(&now);
  }
  Serial.println("\nNTP synced!");

  randomSeed(esp_random());

  sendNPK();
  lastSend = millis();
}

void loop() {
  if (millis() - lastSend >= interval) {
    sendNPK();
    lastSend = millis();
  }
}

void sendNPK() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected!");
    return;
  }

  int n = random(0, 101);
  int p = random(0, 101);
  int k = random(0, 101);

  time_t now;
  time(&now);

  heartbeatCounter++;

  StaticJsonDocument<256> doc;
  doc["n"] = n;
  doc["p"] = p;
  doc["k"] = k;
  // ✅ FIX 3: Send timestamp in MILLISECONDS (multiply by 1000)
  doc["timestamp"] = (unsigned long long)now * 1000ULL;
  doc["heartbeat"] = heartbeatCounter;
  doc["status"] = "alive";

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  String url = String(DATABASE_URL) +
               "/devices/" + DEVICE_ID + "/npk.json";

  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  int httpResponseCode = http.PUT(jsonPayload);

  if (httpResponseCode > 0) {
    Serial.printf(
      "PUT OK [%d] | HB:%lu | N:%d P:%d K:%d | Time: %lu\n",
      httpResponseCode,
      heartbeatCounter,
      n, p, k,
      (unsigned long)now
    );
  } else {
    Serial.printf("PUT Failed: %s\n",
                  http.errorToString(httpResponseCode).c_str());
  }

  http.end();
}
