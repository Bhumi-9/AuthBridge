# Compile the C++ server
echo "Compiling server..."
g++ server.cpp -o server.exe -lws2_32 -std=c++11

if ($LASTEXITCODE -eq 0) {
    echo "Compilation successful. Starting server..."
    # Run the executable
    .\server.exe
} else {
    echo "Compilation failed."
}
