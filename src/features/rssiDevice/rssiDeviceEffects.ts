/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import {
    AppThunk,
    Device,
    DeviceSetupConfig,
    getAppFile,
    isDeviceInDFUBootloader,
    jprogDeviceSetup,
    logger,
    prepareDevice,
    sdfuDeviceSetup,
} from '@nordicsemiconductor/pc-nrfconnect-shared';
import { SerialPort } from 'serialport';

import { clearSerialPort, setSerialPort } from './rssiDeviceSlice';

export const deviceSetupConfig: DeviceSetupConfig = {
    deviceSetups: [
        sdfuDeviceSetup(
            [
                {
                    key: 'pca10059',
                    application: getAppFile('fw/rssi-10059-hephi.hex'),
                    semver: 'rssi_cdc_acm 1.10.1+dfuOct--5-2021-08-31-26',
                    params: {},
                },
            ],
            true,
            d =>
                !isDeviceInDFUBootloader(d) &&
                !!d.serialPorts &&
                d.serialPorts.length > 0 &&
                !!d.traits.nordicUsb &&
                !!d.usb &&
                d.usb.device.descriptor.idProduct === 0xc00a
        ),
        jprogDeviceSetup(
            [
                {
                    key: 'nrf52_family',
                    fw: getAppFile('fw/rssi-10040-hephi.hex'),
                    fwVersion: 'rssi-fw-1.10.1',
                    fwIdAddress: 0x2000,
                },
            ],
            true,
            true
        ),
    ],
};

export const closeDevice = (): AppThunk => dispatch => {
    dispatch(clearSerialPort());
};

export const openDevice =
    (device: Device): AppThunk =>
    dispatch => {
        // Reset serial port settings
        const ports = device.serialPorts;

        if (ports) {
            const comPort = ports[0].comName; // We want to connect to vComIndex 0
            if (comPort) {
                logger.info(`Opening Serial port ${comPort}`);
                const serialPort = new SerialPort(
                    { path: comPort, baudRate: 115200 },
                    error => {
                        if (error) {
                            logger.error(
                                `Failed to open serial port ${comPort}.`
                            );
                            logger.error(`Error ${error}.`);
                            return;
                        }

                        dispatch(setSerialPort(serialPort));
                        logger.info(`Serial Port ${comPort} has been opened`);
                    }
                );
            }
        }
    };

export const recoverHex =
    (device: Device): AppThunk =>
    (dispatch, getState) => {
        getState().app.rssi.serialPort?.close(() => {
            dispatch(clearSerialPort());
            dispatch(
                prepareDevice(
                    device,
                    deviceSetupConfig,
                    programmedDevice => {
                        dispatch(openDevice(programmedDevice));
                    },
                    () => {},
                    undefined,
                    false,
                    false
                )
            );
        });
    };
