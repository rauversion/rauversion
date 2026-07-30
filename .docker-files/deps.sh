set -x

# Install Dependencies
apt-get update -qq \
  && DEBIAN_FRONTEND=noninteractive apt-get install -yq --no-install-recommends \
    build-essential \
    gnupg2 \
    curl \
    less \
    git \
    libvips42 \
    zlib1g-dev

libvips_version="$(dpkg-query -W -f='${Version}' libvips42)"
if ! dpkg --compare-versions "${libvips_version}" ge "8.13"; then
  echo "libvips >= 8.13 is required; found ${libvips_version}" >&2
  exit 1
fi
