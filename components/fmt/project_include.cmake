# This file is loaded before any of the other CMakeLists files in other
# components. Since FetchContent doesn't play nice with the idf components
# we need to fetch the git content here. This downloads and builds the git
# library so it is available to link with the fmt component

include(FetchContent)
FetchContent_Declare(
  fmt
  GIT_REPOSITORY https://github.com/fmtlib/fmt.git
  GIT_TAG a33701196adfad74917046096bf5a2aa0ab0bb50
  PREFIX ${BUILD_DIR}
  SOURCE_DIR ${BUILD_DIR}/fmt
  BINARY_DIR ${BUILD_DIR}/fmt
)
FetchContent_MakeAvailable(fmt)
