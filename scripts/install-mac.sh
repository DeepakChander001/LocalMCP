#!/bin/bash

echo "Installing LocalMCP..."
echo

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check for pnpm
if ! command -v pnpm &> /dev/null; then
    echo "Installing pnpm..."
    npm install -g pnpm
fi

# Install dependencies
echo "Installing dependencies..."
cd ..
pnpm install

# Build extension
echo "Building Chrome extension..."
cd packages/extension
pnpm build

# Generate auth token
echo
echo "Generating authentication token..."
AUTH_TOKEN=$(uuidgen)
echo "AUTH_TOKEN=$AUTH_TOKEN"

# Create .env file
echo "Creating .env file..."
cd ../server
cat > .env << EOF
AUTH_TOKEN=$AUTH_TOKEN
PORT=3000
EOF

echo
echo "Installation complete!"
echo
echo "Your authentication token is: $AUTH_TOKEN"
echo "Please save this token - you'll need it to connect the Chrome extension."
echo
echo "Next steps:"
echo "1. Load the extension in Chrome from: packages/extension/dist"
echo "2. Start the server: pnpm --filter @localmcp/server start"
echo "3. Connect using the token above"