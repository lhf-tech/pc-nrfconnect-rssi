#!/bin/bash
#
# Download the nRF5 SDK in order to compile the connectivity application.
#
# The SDK download link can be configured. The SDK is downloaded and extracted to
# the configured folder.
#
# Adapted from 'https://github.com/NordicSemiconductor/pc-ble-driver'.
# Version 0.5

ABS_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# SDK download link (as zip file, full URL with extension)
function set_sdk_link () {
    SDK_LINK=$1

    SDK_FILE=${SDK_LINK##*/}  # SDK file name with extension
    SDK_NAME=${SDK_FILE%.zip} # SDK folder name without extension
}

# Configuration of the destination folder (relative path from this script)
function set_dl_location () {
    DL_LOCATION="$ABS_PATH/$1"
}

function usage () {
    echo "Usage: bootstrap -l link -d destination [-h]"
    echo
    echo " -l, --link   SDK download link"
    echo " -d, --dest   Destination folder of the downloaded SDK"
    echo
    echo " -h, --help   Show this help message"
}

# Display an error message
function error () {
    printf "\e[1;31m[ERROR] $1\e[0;0m\r\n"
}

# Display a fatal error and exit
function fatal () {
    error "$@"
    exit
}

# Check if the required program are available
function check_requirements () {
    command -v unzip >/dev/null 2>&1 || { fatal "Unzip is not available"; }
    command -v curl >/dev/null 2>&1 || { fatal "Curl is not available"; }
    command -v git >/dev/null 2>&1 || { fatal "Git is not available"; }
}

# Check if the SDK folder already exist
function sdk_exists () {
    if [[ -d $DL_LOCATION ]]; then
        # Erase the existing SDK folder if needed
        echo "> SDK folder is already available"
        read -p "> Do you want to erase the existing SDK folder [Y/n]? " -n 1 -r
        echo

        if [[ $REPLY =~ ^[Y]$ ]]; then
            echo "> Deleting existing SDK folder..."
            rm -rf $DL_LOCATION
        else
            return 0 # Exists
        fi
    fi

    # No SDK folder available
    return 1
}

# Download the SDK. Check if it is already available
function sdk_download () {
    # First check if the SDK already exist
    if sdk_exists $1; then
        # SDK folder already available
        return 0
    fi

    if [[ -z "${SDK_NAME}" ]]; then
        fatal "Invalid SDK link"
    fi

    # Create the destination folder and download the SDK
    echo "> Downloading nRF SDK '${SDK_NAME}'..."

    mkdir -p $DL_LOCATION

    curl --progress-bar -o $DL_LOCATION/$SDK_FILE $SDK_LINK

    err_code=$?
    if [ "$err_code" != "0" ]; then
        fatal "Could not download SDK from '${SDK_LINK}'"
    fi

    echo "> Unzipping SDK..."
    unzip -q $DL_LOCATION/$SDK_FILE "${SDK_NAME}/components/**" "${SDK_NAME}/config/**" "${SDK_NAME}/modules/**" "${SDK_NAME}/integration/**" "${SDK_NAME}/external/**" -d $DL_LOCATION

    mv ${DL_LOCATION}/${SDK_NAME}/components ${DL_LOCATION}/
    mv ${DL_LOCATION}/${SDK_NAME}/config ${DL_LOCATION}/
    mv ${DL_LOCATION}/${SDK_NAME}/modules ${DL_LOCATION}/
    mv ${DL_LOCATION}/${SDK_NAME}/integration ${DL_LOCATION}/
    mv ${DL_LOCATION}/${SDK_NAME}/external ${DL_LOCATION}/

    err_code=$?
    if [ "$err_code" != "0" ]; then
        fatal "Could not unzip the SDK file"
    fi

    echo "> Clean up. Removing SDK zip file..."
    rm $DL_LOCATION/$SDK_FILE

    err_code=$?
    if [ "$err_code" != "0" ]; then
        fatal "Could not remove the SDK zip file"
    fi

    # FIXME: unused files from the modified SDK should be deleted
    # Keep only the components and the connectivity application ?

    echo "Patching..."
    patch sdk/components/drivers_nrf/usbd/nrf_drv_usbd_errata.h usdb.patch
}

function main() {

    while [ "$1" != "" ]; do
        case $1 in
            -l | --link )  shift
                           set_sdk_link $1
                           ;;
            -d | --dest )  shift
                           set_dl_location $1
                           ;;
            -h | --help )  usage
                           exit
                           ;;
            * )            usage
                           exit 1
        esac
        shift
    done

    check_requirements
    sdk_download

    echo "> SDK ready to use. Exit."
    exit
}

main "$@"
