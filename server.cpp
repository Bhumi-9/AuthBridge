#define WIN32_LEAN_AND_MEAN
#include "httplib.h"
#include <iostream>
#include <string>

int main() {
    // Create an HTTP server instance
    httplib::Server svr;

    // Set the base directory to serve static files from
    std::string base_dir = "./public";
    auto ret = svr.set_mount_point("/", base_dir);
    if (!ret) {
        std::cerr << "Failed to set mount point. Does the directory '" << base_dir << "' exist?" << std::endl;
        return 1;
    }

    std::cout << "Starting server on http://localhost:8080..." << std::endl;
    std::cout << "Serving static files from '" << base_dir << "'" << std::endl;

    // Start listening on port 8080
    if (!svr.listen("0.0.0.0", 8080)) {
        std::cerr << "Error: Failed to start server. Port 8080 might be in use." << std::endl;
        return 1;
    }

    return 0;
}
