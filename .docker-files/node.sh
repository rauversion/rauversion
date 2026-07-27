set -ex

case "$(dpkg --print-architecture)" in
    amd64)
        NODE_ARCH="x64"
        NODE_CHECKSUM="7a8cb04b4a1df4eaf432125324b81b29a088e73570a23259a8de1c65d07fc129"
        ;;
    arm64)
        NODE_ARCH="arm64"
        NODE_CHECKSUM="543fa39e57d4c07855939459a323f4deb9a79dd1bb45e6e99458b0f2de10db8d"
        ;;
    *)
        echo "Unsupported Node.js architecture: $(dpkg --print-architecture)" >&2
        exit 1
        ;;
esac

NODE_DIST="node-v$NODE_VERSION-linux-$NODE_ARCH"
NODE_ARCHIVE="/tmp/$NODE_DIST.tar.gz"

curl -fsSL \
    "https://nodejs.org/dist/v$NODE_VERSION/$NODE_DIST.tar.gz" \
    -o "$NODE_ARCHIVE"

echo "$NODE_CHECKSUM  $NODE_ARCHIVE" | sha256sum --check -
tar -xzf "$NODE_ARCHIVE" -C /usr/local --strip-components=1 --no-same-owner

npm install --global "yarn@$YARN_VERSION"
