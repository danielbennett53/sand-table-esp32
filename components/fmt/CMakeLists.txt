idf_component_register(INCLUDE_DIRS "${fmt_SOURCE_DIR}/include")
target_link_libraries(__idf_fmt INTERFACE fmt)
