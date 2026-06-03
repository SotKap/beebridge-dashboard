/*
  BeeBridge ESP32-CAM Snapshot Server

  What this program does:
  1. Connects the ESP32-CAM to WiFi.
  2. Starts the camera using the AI Thinker ESP32-CAM pins.
  3. Creates a tiny web server.
  4. Shows a simple web page at http://ESP32_IP_ADDRESS/
  5. Sends one JPEG camera picture at http://ESP32_IP_ADDRESS/capture

  Before uploading:
  - Change WIFI_SSID and WIFI_PASSWORD to your WiFi network name and password.
  - In the Arduino IDE, choose the "AI Thinker ESP32-CAM" board.
*/

#include "WiFi.h"
#include "WebServer.h"
#include "esp_camera.h"

// Put your WiFi network name and password here.
const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// The web server listens on port 80, the normal port for websites.
WebServer server(80);

// AI Thinker ESP32-CAM pin setup.
// These numbers tell the ESP32 which wires are connected to the camera chip.
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

void addCorsHeaders() {
  // CORS lets a phone, tablet, or laptop dashboard fetch the camera image.
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.sendHeader("Access-Control-Allow-Private-Network", "true");
}

void handleRoot() {
  addCorsHeaders();

  // This is a very small page so students can test the camera in a browser.
  String page = "";
  page += "<!doctype html><html><head>";
  page += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
  page += "<title>BeeBridge ESP32-CAM</title>";
  page += "</head><body>";
  page += "<h1>BeeBridge ESP32-CAM</h1>";
  page += "<p>The camera is online.</p>";
  page += "<p><a href='/capture'>Open one JPEG snapshot</a></p>";
  page += "<img src='/capture' style='max-width:100%;height:auto;' alt='ESP32-CAM snapshot'>";
  page += "</body></html>";

  server.send(200, "text/html", page);
}

void handleCapture() {
  // Ask the camera for one picture frame.
  camera_fb_t* frame = esp_camera_fb_get();

  if (frame == NULL) {
    addCorsHeaders();
    server.send(500, "text/plain", "Camera capture failed");
    return;
  }

  // Send normal web headers first, then send the raw JPEG picture bytes.
  WiFiClient client = server.client();
  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: image/jpeg");
  client.print("Content-Length: ");
  client.println(frame->len);
  client.println("Content-Disposition: inline; filename=snapshot.jpg");
  client.println("Access-Control-Allow-Origin: *");
  client.println("Access-Control-Allow-Methods: GET, OPTIONS");
  client.println("Access-Control-Allow-Headers: Content-Type");
  client.println("Access-Control-Allow-Private-Network: true");
  client.println("Connection: close");
  client.println();
  client.write(frame->buf, frame->len);

  // Return the picture memory so the ESP32 can use it again later.
  esp_camera_fb_return(frame);
}

void handleStatus() {
  addCorsHeaders();

  String status = "{";
  status += "\"device\":\"BeeBridge ESP32-CAM\",";
  status += "\"online\":true,";
  status += "\"ip\":\"";
  status += WiFi.localIP().toString();
  status += "\"";
  status += "}";

  server.send(200, "application/json", status);
}

void handleOptions() {
  // Some apps ask permission first with an OPTIONS request before fetching.
  addCorsHeaders();
  server.send(204);
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Keep trying until WiFi is connected.
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("ESP32-CAM IP address: ");
  Serial.println(WiFi.localIP());
}

void startCamera() {
  camera_config_t config = {};
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  // If the ESP32-CAM has PSRAM, we can use a bigger, better picture.
  if (psramFound()) {
    config.frame_size = FRAMESIZE_SVGA;
    config.jpeg_quality = 10;
    config.fb_count = 2;
    config.fb_location = CAMERA_FB_IN_PSRAM;
    config.grab_mode = CAMERA_GRAB_LATEST;
  } else {
    config.frame_size = FRAMESIZE_VGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
    config.fb_location = CAMERA_FB_IN_DRAM;
    config.grab_mode = CAMERA_GRAB_WHEN_EMPTY;
  }

  esp_err_t error = esp_camera_init(&config);

  if (error != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x\n", error);
    return;
  }

  Serial.println("Camera ready!");
}

void startWebServer() {
  server.on("/", HTTP_GET, handleRoot);
  server.on("/capture", HTTP_GET, handleCapture);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/", HTTP_OPTIONS, handleOptions);
  server.on("/capture", HTTP_OPTIONS, handleOptions);
  server.on("/status", HTTP_OPTIONS, handleOptions);

  server.begin();
  Serial.println("Web server started!");
}

void setup() {
  Serial.begin(115200);
  Serial.println();
  Serial.println("Starting BeeBridge ESP32-CAM...");

  startCamera();
  connectToWiFi();
  startWebServer();
}

void loop() {
  // This checks if a browser or dashboard has asked for a page or photo.
  server.handleClient();
}
