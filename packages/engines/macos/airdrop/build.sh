#!/usr/bin/env bash
#
# Builds the AirDrop engine into Core/AirDrop/bin/airdrop.
#
# The output is committed to the repo: swiftc emits an adhoc, linker-signed
# arm64 binary that runs out of the box, so end users never build or sign.

set -euo pipefail

package_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source_dir="${package_dir}/Core/AirDrop"
bin_dir="${source_dir}/bin"

mkdir -p "${bin_dir}"

swiftc -O \
  -target arm64-apple-macos13.0 \
  -o "${bin_dir}/airdrop" \
  "${source_dir}"/*.swift

codesign --display --verbose=2 "${bin_dir}/airdrop" 2>&1 | sed -n '1,4p'
