#pragma once

#include "driver/sdspi_host.h"
#include "sdmmc_cmd.h"

#include <stdio.h>
#include <string>
#include <vector>

class SDCard
{
public:

SDCard();

bool readFile(const std::string filename, std::string& data);
int writeFile(const std::string filename, const std::string_view& data,
              bool append = true);
std::vector<std::string> get_files_recursive(const std::string directory);
private:
  const std::string mount_point_{"/sdcard"};
  sdmmc_card_t* card_;
  sdmmc_host_t host_ = SDSPI_HOST_DEFAULT();

  // This flag is set to true when the driver is initialized. If there are any
  // errors the constructor will exit and this will be false
  bool initialized_{false};

  // Tracks the current read/write transaction
  std::string current_filename_{};
  FILE* current_file_{NULL};
};

SDCard& getSDCard();