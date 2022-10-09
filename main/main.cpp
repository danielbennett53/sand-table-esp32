#include <iostream>
#include <string>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "Hotspot.hpp"


class HelloCMake final
{
    public:
void run(int i)
{
    //fmt::print("Hello world fmt {}\n", i);
    vTaskDelay(pdMS_TO_TICKS(1000));
}
};

extern "C" void app_main(void)
{
    HelloCMake App;
    Hotspot hs;
    int i = 0;
    std::string data;
    // data.reserve(1024);
    // bool num = sd_card.readFile("/test.txtt", data);
    // fmt::print("{} bytes from file: {}\n", data.size(), data);
    // fmt::print("Read Complete: {}\n", num);

    while (true)
    {
        App.run(i);
        i++;
    }
}