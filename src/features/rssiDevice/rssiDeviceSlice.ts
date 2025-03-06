/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AutoDetectTypes } from '@serialport/bindings-cpp';
import { SerialPort } from 'serialport';

import type { RootState } from '../../app/store';
import { RssiDevice } from './createRssiDevice';

const initialData = () => new Array(168).fill(undefined).map(() => []);

type NumberPair = readonly [number, number];

const sortedPair = ([a, b]: NumberPair): NumberPair =>
    a < b ? [a, b] : [b, a];

export const initialLevelRange = {
    min: 0,
    max: 110,
};

export const nrfChannels = [
    -40, -39, -38, -37, -36, -35, -34, -33, -32, -31, -30, -29, -28, -27, -26,
    -25, -24, -23, -22, -21, -20, -19, -18, -17, -16, -15, -14, -13, -12, -11,
    -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
    30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
    49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67,
    68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86,
    87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104,
    105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119,
    120, 121, 122, 123, 124, 125, 126, 127,
];

export const nrfChannelsRange = {
    min: Math.min(...nrfChannels),
    max: Math.max(...nrfChannels),
};

interface RssiState {
    isPaused: boolean;
    buffer: readonly number[];
    data: readonly (readonly number[])[];
    dataMax: readonly number[];
    delay: number;
    scanRepeat: number;
    maxScans: number;
    animationDuration: number;
    channelRange: NumberPair;
    levelRange: NumberPair;
    noDataReceived: boolean;
    serialPort?: SerialPort<AutoDetectTypes>;
    rssiDevice?: RssiDevice;
}

const initialState: RssiState = {
    isPaused: false,
    buffer: [],
    data: initialData(),
    dataMax: [],
    delay: 10,
    scanRepeat: 1,
    maxScans: 30,
    animationDuration: 500,
    channelRange: [nrfChannelsRange.min, nrfChannelsRange.max],
    levelRange: [initialLevelRange.min, initialLevelRange.max],
    noDataReceived: false,
};

const rssiSlice = createSlice({
    name: 'rssi',
    initialState,
    reducers: {
        setSerialPort: (
            state,
            action: PayloadAction<SerialPort<AutoDetectTypes>>
        ) => {
            state.serialPort = action.payload;
        },
        setRssiDevice: (state, action: PayloadAction<RssiDevice>) => {
            state.rssiDevice = action.payload;
        },

        clearSerialPort: state => {
            state.serialPort = undefined;
            state.rssiDevice = undefined;
        },

        toggleIsPaused: state => {
            state.isPaused = !state.isPaused;
        },

        clearRssiData: state => {
            state.data = initialData();
            state.dataMax = [];
            state.noDataReceived = false;
        },

        resetRssiStore: state => {
            state.buffer = [];
            state.data = initialData();
            state.dataMax = [];
            state.noDataReceived = false;
            state.isPaused = false;
        },

        setDelay: (state, action: PayloadAction<number>) => {
            state.delay = action.payload;
        },

        setMaxScans: (state, action: PayloadAction<number>) => {
            state.maxScans = action.payload;
        },

        setScanRepeat: (state, action: PayloadAction<number>) => {
            state.scanRepeat = action.payload;
        },

        setAnimationDuration: (state, action: PayloadAction<number>) => {
            state.animationDuration = action.payload;
        },

        setChannelRange: (state, action: PayloadAction<[number, number]>) => {
            state.channelRange = action.payload;
        },

        setLevelRange: (state, action: PayloadAction<[number, number]>) => {
            state.levelRange = action.payload;
        },

        onReceiveRssiData: (state, action: PayloadAction<Buffer>) => {
            if (!state.serialPort || !state.serialPort.isOpen) {
                state.data = initialData();
                state.dataMax = [];
                return;
            }

            if (state.isPaused) {
                return;
            }

            state.buffer = [...state.buffer, ...action.payload];

            if (state.buffer.length > 504) {
                state.buffer.splice(0, state.buffer.length - 504);
            }
            while (state.buffer.length >= 3) {
                while (state.buffer.length && state.buffer.shift() !== 0xff);

                const [ch, d] = state.buffer.splice(0, 2);
                if (ch !== 0xff && d !== 0xff) {
                    state.data[ch] = [d, ...state.data[ch]];
                    state.data[ch].splice(state.maxScans);
                    state.dataMax[ch] = Math.min(...state.data[ch]);
                }
            }
        },

        onReceiveNoRssiData: state => {
            if (state.isPaused) {
                return;
            }
            state.noDataReceived = true;
        },
    },
});

export const getSerialPort = (state: RootState) => state.app.rssi.serialPort;
export const getRssiDevice = (state: RootState) => state.app.rssi.rssiDevice;
export const getIsConnected = (state: RootState) => !!state.app.rssi.serialPort;
export const getIsPaused = (state: RootState) => state.app.rssi.isPaused;

export const getRssi = (state: RootState) =>
    state.app.rssi.data.map(scan => scan[0]);
export const getRssiMax = (state: RootState) => state.app.rssi.dataMax;
export const getAnimationDuration = (state: RootState) =>
    state.app.rssi.animationDuration;
export const getDelay = (state: RootState) => state.app.rssi.delay;
export const getMaxScans = (state: RootState) => state.app.rssi.maxScans;
export const getScanRepeat = (state: RootState) => state.app.rssi.scanRepeat;

export const getChannelRange = (state: RootState) =>
    state.app.rssi.channelRange;
export const getChannelRangeSorted = (state: RootState) =>
    sortedPair(getChannelRange(state));

export const getLevelRange = (state: RootState) => state.app.rssi.levelRange;
export const getLevelRangeSorted = (state: RootState) =>
    sortedPair(getLevelRange(state));

export const getNoDataReceived = (state: RootState) =>
    state.app.rssi.noDataReceived;

export const {
    setSerialPort,
    setRssiDevice,
    clearSerialPort,
    toggleIsPaused,
    resetRssiStore,
    clearRssiData,
    setDelay,
    setMaxScans,
    setScanRepeat,
    setAnimationDuration,
    setChannelRange,
    setLevelRange,
    onReceiveRssiData,
    onReceiveNoRssiData,
} = rssiSlice.actions;
export default rssiSlice.reducer;
