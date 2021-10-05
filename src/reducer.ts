/* Copyright (c) 2015 - 2017, Nordic Semiconductor ASA
 *
 * All rights reserved.
 *
 * Use in source and binary forms, redistribution in binary form only, with
 * or without modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions in binary form, except as embedded into a Nordic
 *    Semiconductor ASA integrated circuit in a product or a software update for
 *    such product, must reproduce the above copyright notice, this list of
 *    conditions and the following disclaimer in the documentation and/or other
 *    materials provided with the distribution.
 *
 * 2. Neither the name of Nordic Semiconductor ASA nor the names of its
 *    contributors may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
 *
 * 3. This software, with or without modification, must only be used with a Nordic
 *    Semiconductor ASA integrated circuit.
 *
 * 4. Any software provided in binary form under this license must not be reverse
 *    engineered, decompiled, modified and/or disassembled.
 *
 * THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import produce, { Draft } from 'immer';
import { logger, NrfConnectState } from 'pc-nrfconnect-shared';

import { RssiAction, RssiActionType } from './actions';

export const initialLevelRange = {
    min: 0,
    max: 110,
};

// prettier-ignore
export const nrfChannels = [
    -40,-39,-38,-37,-36,-35,-34,-33,-32,-31,-30,-29,-28,-27,-26,-25,-24,-23,-22,-21,
    -20,-19,-18,-17,-16,-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,
    5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,
    34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,
    62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,
    90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,
    114,115,116,117,118,119,120,121,122,123,124,125,126,127,  
];

export const nrfChannelsRange = {
    min: Math.min(...nrfChannels),
    max: Math.max(...nrfChannels),
};

const initialData = () => new Array(168).fill(0).map(() => []);

type NumberPair = readonly [number, number];

interface RssiState {
    readonly isPaused: boolean;
    readonly buffer: readonly number[];
    readonly data: readonly (readonly number[])[];
    readonly dataMax: readonly number[];
    readonly delay: number;
    readonly scanRepeat: number;
    readonly maxScans: number;
    readonly animationDuration: number;
    readonly channelRange: NumberPair;
    readonly levelRange: NumberPair;
    readonly port: string | null;
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
    port: null,
};

const updateData = (rawData: Buffer, draft: Draft<RssiState>) => {
    draft.buffer = [...draft.buffer, ...rawData];

    // if (draft.buffer.length > 504) {
    //    draft.buffer.splice(0, draft.buffer.length - 504);
    // }
    while (draft.buffer.length >= 3) {
        const newpck = draft.buffer.splice(0, 1)[0];
        if (newpck !== 0xff) {
            logger.error(
                `new packet byte[${newpck} != 0xFF], continue processing the next byte`
            );
        } else {
            const [ch, d] = draft.buffer.splice(0, 2);
            if (ch !== 0xff && d !== 0xff) {
                draft.data[ch] = [d, ...draft.data[ch]];
                draft.data[ch].splice(draft.maxScans);
                draft.dataMax[ch] = Math.min(...draft.data[ch]);
            }
        }
    }
};

export default produce((draft: Draft<RssiState>, action: RssiAction) => {
    switch (action.type) {
        case RssiActionType.TOGGLE_PAUSE:
            draft.isPaused = !draft.isPaused;
            break;

        case RssiActionType.RECEIVE_RSSI_DATA:
            if (draft.isPaused) {
                break;
            }
            updateData(action.rawData, draft);
            break;

        case RssiActionType.CLEAR_RSSI_DATA:
            draft.data = initialData();
            draft.dataMax = [];
            break;

        case RssiActionType.SET_DELAY:
            draft.delay = action.delay;
            break;

        case RssiActionType.SET_MAX_SCANS:
            draft.maxScans = action.maxScans;
            break;

        case RssiActionType.SET_SCAN_REPEAT:
            draft.scanRepeat = action.scanRepeat;
            break;

        case RssiActionType.SET_ANIMATION_DURATION:
            draft.animationDuration = action.animationDuration;
            break;

        case RssiActionType.SET_CHANNEL_RANGE:
            draft.channelRange = action.channelRange;
            break;

        case RssiActionType.SET_LEVEL_RANGE:
            draft.levelRange = action.levelRange;
            break;

        case RssiActionType.PORT_OPENED:
            draft.port = action.portName;
            draft.isPaused = false;
            break;

        case RssiActionType.PORT_CLOSED:
            draft.port = null;
            draft.isPaused = true;
    }
}, initialState);

type AppState = NrfConnectState<RssiState>;

const sortedPair = ([a, b]: NumberPair): NumberPair =>
    a < b ? [a, b] : [b, a];

export const getIsConnected = (state: AppState) => state.app.port != null;
export const getIsPaused = (state: AppState) => state.app.isPaused;

export const getRssi = (state: AppState) => state.app.data.map(scan => scan[0]);
export const getRssiMax = (state: AppState) => state.app.dataMax;
export const getAnimationDuration = (state: AppState) =>
    state.app.animationDuration;
export const getDelay = (state: AppState) => state.app.delay;
export const getMaxScans = (state: AppState) => state.app.maxScans;
export const getScanRepeat = (state: AppState) => state.app.scanRepeat;

export const getChannelRange = (state: AppState) => state.app.channelRange;
export const getChannelRangeSorted = (state: AppState) =>
    sortedPair(getChannelRange(state));

export const getLevelRange = (state: AppState) => state.app.levelRange;
export const getLevelRangeSorted = (state: AppState) =>
    sortedPair(getLevelRange(state));
