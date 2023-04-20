/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

// import { SerialPort as DeviceSerialport } from '@nordicsemiconductor/nrf-device-lib-js';
import { Device, logger } from 'pc-nrfconnect-shared';
import { TDispatch } from 'pc-nrfconnect-shared/typings/generated/src/state';
import { SerialPort } from 'serialport';

import {
    clearRssiData,
    portClosed,
    portOpened,
    receiveNoRssiData,
    receiveRssiData,
} from './actions';

let port: SerialPort | null = null;

const writeAndDrain = async (cmd: string) => {
    if (port) {
        await new Promise(resolve => {
            logger.info(cmd);
            port?.write(cmd, () => {
                port?.drain(resolve);
            });
        });
    }
};

export const writeChannel = async (min: number, max: number) => {
    await writeMinChannel(min);
    await writeMaxChannel(max);
};

export const writeMinChannel = (channel: number) =>
    writeAndDrain(`set channel min ${channel}\r`);

export const writeMaxChannel = (channel: number) =>
    writeAndDrain(`set channel max ${channel}\r`);

export const writeDelay = (delay: number) =>
    writeAndDrain(`set delay ${delay}\r`);

export const writeScanRepeat = (scanRepeat: number) =>
    writeAndDrain(`set repeat ${scanRepeat}\r`);

export const toggleLED = () => writeAndDrain('led\r');

export const writeOther = (other: string) => writeAndDrain(`${other}\r`);

export const resumeReading = async (
    min: number,
    max: number,
    delay: number,
    scanRepeat: number
) => {
    await writeDelay(delay);
    await writeScanRepeat(scanRepeat);
    await writeMinChannel(min);
    await writeMaxChannel(max);
    await writeAndDrain('start\r');
};

export const pauseReading = () => writeAndDrain('stop\r');

export const startReading = (
    device: Device,
    min: number,
    max: number,
    delay: number,
    scanRepeat: number,
    dispatch: TDispatch
) => {
    const comName = device.serialport?.comName ?? '';
    port = new SerialPort({ path: comName, baudRate: 115200 }, () => {
        const noDataTimeout = setTimeout(() => {
            dispatch((_, getState) => {
                if (getState().device.readbackProtection === 'protected') {
                    dispatch(receiveNoRssiData());
                }
            });
        }, 3000);

        logger.info(`${comName} is open`);

        dispatch(portOpened(comName));

        resumeReading(min, max, delay, scanRepeat);

        port?.on('data', data => {
            clearTimeout(noDataTimeout);
            dispatch(receiveRssiData(data));
        });
        port?.on('error', console.log);

        port?.on('close', () => {
            dispatch(portClosed());
            dispatch(clearRssiData());
        });
    });
};

export const stopReading = async () => {
    if (port?.isOpen) {
        await pauseReading();
        await new Promise((resolve, reject) => {
            setTimeout(() => reject, 1000);
            port?.close(resolve);
        });
        port = null;
    }
    logger.info('Serial port is closed');
};
