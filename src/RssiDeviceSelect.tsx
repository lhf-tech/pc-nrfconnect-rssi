/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Device,
    DeviceSelector,
    getAppFile,
    logger,
} from 'pc-nrfconnect-shared';

import {
    clearRssiData,
    portClosed,
    portOpened,
    receiveRssiData,
} from './actions';
import { getDelay, getScanRepeat } from './reducer';
import { startReading, stopReading } from './serialport';

const deviceListing = {
    nordicUsb: true,
    serialport: true,
    jlink: true,
};
const deviceSetup = {
    dfu: {
        pca10059: {
            application: getAppFile('fw/rssi-10059-hephi.hex'),
            semver: 'rssi_cdc_acm 1.10.1+dfuOct--5-2021-08-31-26',
        },
    },
    jprog: {
        nrf52: {
            fw: getAppFile('fw/rssi-10040-hephi.hex'),
            fwVersion: 'rssi-fw-1.10.1',
            fwIdAddress: 0x2000,
        },
    },
    needSerialport: true,
};

const logSelectedDevice = (device: Device) => {
    logger.info(
        `Validating firmware for device with s/n ${device.serialNumber}`
    );
};

export default () => {
    const dispatch = useDispatch();
    const delay = useSelector(getDelay);
    const scanRepeat = useSelector(getScanRepeat);

    const startReadingFromDevice = (device: Device) => {
        logger.info(`Opening device with s/n ${device.serialNumber}`);
        dispatch(portClosed());
        dispatch(clearRssiData());

        stopReading().then(() => {
            if (device.serialport == null) {
                logger.error(`Missing serial port information`);
                return;
            }

            startReading(
                device.serialport,
                delay,
                scanRepeat,
                portName => dispatch(portOpened(portName)),
                data => dispatch(receiveRssiData(data))
            );
        });
    };

    const stopReadingFromDevice = () => {
        logger.info('Deselecting device');

        stopReading().then(() => {
            dispatch(portClosed());
            dispatch(clearRssiData());
        });
    };

    return (
        <DeviceSelector
            deviceListing={deviceListing}
            deviceSetup={deviceSetup}
            onDeviceSelected={logSelectedDevice}
            onDeviceIsReady={startReadingFromDevice}
            onDeviceDeselected={stopReadingFromDevice}
        />
    );
};
