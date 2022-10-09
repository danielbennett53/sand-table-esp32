#include "Hotspot.hpp"

#include "esp_http_server.h"
#include "esp_wifi.h"
#include "nvs_flash.h"

#include <algorithm>
#include <cstring>

// Hotspot Info
#define HOTSPOT_SSID            "SandTable"
#define HOTSPOT_PASSWORD        "Sysiphus"
#define HOTSPOT_CHANNEL         1
#define HOTSPOT_MAX_CONNECTIONS 1

namespace {

static void event_handler(void* arg, esp_event_base_t event_base,
                          int32_t event_id, void* event_data) {

}

bool ends_with(const std::string& str, const std::string& sub_str)
{
  if (sub_str.size() > str.size())
    return false;

  for (size_t i = 0; i < sub_str.size(); ++i) {
    if (str[str.size() - 1 - i] != sub_str[sub_str.size() - 1 - i])
      return false;
  }
  return true;
}

static esp_err_t uri_get_handler(httpd_req_t* req)
{
  static std::string buffer(1024, '\0');
  std::string uri{req->uri};
  if (uri == "/")
    uri = "/index.htm";

  if (ends_with(uri, ".css")) {
    httpd_resp_set_type(req, "text/css");
  } else if (ends_with(uri, ".js")) {
    httpd_resp_set_type(req, "text/javascript");
  } else if (ends_with(uri, ".ico")) {
    httpd_resp_set_type(req, "image/x-icon");
  }
  bool complete = false;
  do {
    complete = getSDCard().readFile("/www" + uri, buffer);
    httpd_resp_send_chunk(req, buffer.data(), buffer.size());
  } while (!complete);
  httpd_resp_send_chunk(req, buffer.data(), 0);
  return ESP_OK;
} // uri_get_handler

static esp_err_t error_handler(httpd_req_t* req, httpd_err_code_t err)
{
  std::string uri{req->uri};
  httpd_resp_send_err(req, HTTPD_404_NOT_FOUND, (uri + " is not found").c_str());
  return ESP_OK;
}

} // namespace

Hotspot::Hotspot()
{
  ESP_ERROR_CHECK(nvs_flash_init());
  ESP_ERROR_CHECK(esp_netif_init());
  ESP_ERROR_CHECK(esp_event_loop_create_default());
  esp_netif_create_default_wifi_ap();

  wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
  ESP_ERROR_CHECK(esp_wifi_init(&cfg));
  ESP_ERROR_CHECK(esp_wifi_set_storage(WIFI_STORAGE_RAM));
  ESP_ERROR_CHECK(esp_event_handler_instance_register(WIFI_EVENT,
                                                      ESP_EVENT_ANY_ID,
                                                      &event_handler,
                                                      NULL,
                                                      NULL));

  static wifi_config_t wifi_config ={
    .ap = {
      {.ssid = HOTSPOT_SSID},
      {.password = HOTSPOT_PASSWORD},
      .ssid_len = strlen(HOTSPOT_SSID),
      .channel = HOTSPOT_CHANNEL,
      .authmode = WIFI_AUTH_WPA_WPA2_PSK,
      .max_connection = HOTSPOT_MAX_CONNECTIONS,
    },
  };

  if (strlen(HOTSPOT_PASSWORD) == 0) {
      wifi_config.ap.authmode = WIFI_AUTH_OPEN;
  }

  ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_AP));
  ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_AP, &wifi_config));
  ESP_ERROR_CHECK(esp_wifi_start());

  httpd_handle_t server = NULL;
  httpd_config_t config = HTTPD_DEFAULT_CONFIG();
  config.lru_purge_enable = true;
  config.max_uri_handlers = 24;

  httpd_start(&server, &config);

  auto files = getSDCard().get_files_recursive("/www");
  static httpd_uri_t uri = {
    .uri = "",
    .method = HTTP_GET,
    .handler = uri_get_handler,
    .user_ctx = NULL,
  };
  for (auto& f : files) {
    uri.uri = f.c_str();
    httpd_register_uri_handler(server, &uri);
    std::transform(f.begin(), f.end(), f.begin(),
        [](unsigned char c){ return std::tolower(c); });
    uri.uri = f.c_str();
    httpd_register_uri_handler(server, &uri);
    // Todo: add error handling
  }
  uri.uri = "/";
  httpd_register_uri_handler(server, &uri);
  httpd_register_err_handler(server, HTTPD_404_NOT_FOUND, error_handler);
}