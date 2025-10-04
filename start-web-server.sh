#!/bin/bash

# Meteor Madness Web Server Startup Script

echo "🚀 Starting Meteor Madness Web Server..."

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "❌ Java is not installed or not in PATH"
    echo "Please install Java 17 or later and try again"
    exit 1
fi

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "❌ Maven is not installed or not in PATH"
    echo "Please install Maven and try again"
    exit 1
fi

# Set NASA API key if available
if [ -z "$NASA_API_KEY" ]; then
    echo "⚠️  NASA_API_KEY environment variable not set"
    echo "Using DEMO_KEY (rate-limited). Set NASA_API_KEY for better performance."
    echo ""
fi

# Compile the project
echo "📦 Compiling project..."
mvn clean compile

if [ $? -ne 0 ]; then
    echo "❌ Compilation failed"
    exit 1
fi

# Start the web server
echo "🌐 Starting web server on http://localhost:8080"
echo "📊 Open your browser and navigate to the URL above to view the dashboard!"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

java -cp "target/classes:$(mvn dependency:build-classpath -q -Dmdep.outputFile=/dev/stdout)" org.spaceapps.meteormadness.WebServer
