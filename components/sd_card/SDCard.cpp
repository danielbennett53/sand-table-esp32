#include "SDCard.hpp"

#include "driver/spi_common.h"
#include "esp_vfs_fat.h"

#include <dirent.h>
#include <iostream>
#include <mutex>


std::vector<std::string> SDCard::get_files_recursive(const std::string directory)
{
  std::vector<std::string> files;
  std::vector<std::string> search_dirs;
  search_dirs.push_back("");

  while (search_dirs.size()) {
    auto search_dir = search_dirs.back();
    search_dirs.pop_back();

    DIR* raw_dir = opendir((mount_point_ + directory + search_dir).c_str());
    if (!raw_dir)
      continue;
    auto entry = readdir(raw_dir);
    while (entry) {
      std::string full_name = search_dir + "/" + std::string(entry->d_name);
      if (entry->d_type == 1)
        files.push_back(full_name);
      else if (entry->d_type == 2)
        search_dirs.push_back(full_name);
      entry = readdir(raw_dir);
    }
    closedir(raw_dir);
  }

  return files;
} // get_files_recursive


SDCard::SDCard()
{
  // Error reporting
  esp_err_t ret;

  // Options for mounting the filesystem.
  // If format_if_mount_failed is set to true, SD card will be partitioned and
  // formatted in case when mounting fails.
  esp_vfs_fat_sdmmc_mount_config_t mount_config = {
    .format_if_mount_failed = false,
    .max_files = 4,
    .allocation_unit_size = 16 * 1024,
  };

  spi_bus_config_t bus_cfg = {
    .mosi_io_num = 9,
    .miso_io_num = 18,
    .sclk_io_num = 8,
    .quadwp_io_num = -1,
    .quadhd_io_num = -1,
    .max_transfer_sz = 4000,
    .flags = 0,
    .intr_flags = 0,
  };

  ret = spi_bus_initialize((spi_host_device_t) host_.slot, &bus_cfg,
                           SPI_DMA_CH_AUTO);
  if (ret != ESP_OK) {
      printf("Failed to initialize SPI bus for SDCard.\n");
      return;
  }

  // This initializes the slot without card detect (CD) and write protect (WP)
  // signals. Modify slot_config.gpio_cd and slot_config.gpio_wp if your board
  // has these signals.
  sdspi_device_config_t slot_config = SDSPI_DEVICE_CONFIG_DEFAULT();
  slot_config.gpio_cs = (gpio_num_t) 19;
  slot_config.host_id = (spi_host_device_t) host_.slot;

  ret = esp_vfs_fat_sdspi_mount(mount_point_.c_str(), &host_, &slot_config,
                                &mount_config, &card_);

  if (ret != ESP_OK) {
    if (ret == ESP_FAIL) {
      printf("Failed to mount filesystem. If you want the card to be "
                 "formatted, set the EXAMPLE_FORMAT_IF_MOUNT_FAILED menuconfig"
                 " option.\n");
    } else {
      printf("Failed to initialize the card {}. Make sure SD card lines "
                 "have pull-up resistors in place.\n", esp_err_to_name(ret));
    }
    return;
  }

  initialized_ = true;
}


bool SDCard::readFile(const std::string filename, std::string& data)
{
  if (filename != current_filename_) {
    if (current_file_) {
      fclose(current_file_);
    }
    current_file_ = fopen((mount_point_ + filename).c_str(), "r");
    if (!current_file_) {
      current_filename_ = "";
      return false;
    }
  }

  auto current_pos = ftell(current_file_);
  fseek(current_file_, 0, SEEK_END);

  auto diff = ftell(current_file_) - current_pos;
  fseek(current_file_, current_pos, SEEK_SET);

  diff = diff > data.capacity() ? data.capacity() : diff;
  data.resize(diff);

  fread((void*) data.data(), 1, data.size(), current_file_);

  // Close file if read is complete (bytes read is less than capacity)
  bool complete = data.size() < data.capacity();
  if (complete) {
    fclose(current_file_);
    current_file_ = NULL;
    current_filename_ = "";
  } else {
    current_filename_ = filename;
  }

  return complete;
}

SDCard& getSDCard()
{
  static SDCard sd_card;
  return sd_card;
}