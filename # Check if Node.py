# Check if Node.js and npm are installed
if ! command -v node &> /dev/null
then
    echo "Node.js is not installed."
    exit 1
fi

# Check the Node.js installation directory (you may need to adjust this based on where Node.js is installed)
NODE_PATH=$(which node)
NODE_DIR=$(dirname "$NODE_PATH")

# Add the Node.js path to the system environment PATH
echo "Adding Node.js and npm to PATH..."

# For Git Bash (which uses Windows paths), we need to update the Windows environment variable
# Extract the correct Windows path format
WIN_PATH=$(cygpath -w "$NODE_DIR")

# Add the path to the Windows environment variable permanently (using setx)
setx PATH "$PATH;$WIN_PATH"

# Notify the user
echo "Node.js and npm have been added to your PATH."
