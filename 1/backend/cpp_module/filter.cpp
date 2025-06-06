#include <vector>
#include <string>
#include <stdexcept>
#include <pybind11/pybind11.h>
#include <pybind11/stl.h>

namespace py = pybind11;

std::vector<unsigned char> invert(const std::vector<unsigned char>& data) {
    std::vector<unsigned char> result = data;
    for (size_t i = 0; i < result.size(); i += 4) {
        result[i] = 255 - result[i];       // R
        result[i + 1] = 255 - result[i + 1]; // G
        result[i + 2] = 255 - result[i + 2]; // B
        // alpha (i+3) — залишаємо без змін
    }
    return result;
}

std::vector<unsigned char> apply_filter_cpp(const std::vector<unsigned char>& data, int width, int height, const std::string& filter_name) {
    if (filter_name == "invert") {
        return invert(data);
    }
    throw std::runtime_error("Unknown filter: " + filter_name);
}

PYBIND11_MODULE(filter, m) {
    m.def("apply_filter_cpp", &apply_filter_cpp, "Apply image filter in C++");
}
