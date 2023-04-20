/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import Form from 'react-bootstrap/Form';
import { useDispatch, useSelector } from 'react-redux';
import { NumberInlineInput, Slider } from 'pc-nrfconnect-shared';

import { setChannelRange } from '../actions';
import { getChannelRange, nrfChannelsRange } from '../reducer';
import { writeChannel } from '../serialport';

const sliderId = 'ble-channel-slider';

export default () => {
    const dispatch = useDispatch();
    const channelRange = useSelector(getChannelRange);

    const min = Math.min(...channelRange);
    const max = Math.max(...channelRange);

    return (
        <>
            <Form.Label htmlFor={sliderId}>
                Channels from{' '}
                <NumberInlineInput
                    value={min}
                    range={{ min: nrfChannelsRange.min, max }}
                    onChange={(newMin: number) =>
                        dispatch(setChannelRange([newMin, max]))
                    }
                    onChangeComplete={() =>
                        writeChannel(channelRange[0], channelRange[1])
                    }
                />{' '}
                to{' '}
                <NumberInlineInput
                    value={max}
                    range={{ min, max: nrfChannelsRange.max }}
                    onChange={(newMax: number) =>
                        dispatch(setChannelRange([min, newMax]))
                    }
                    onChangeComplete={() =>
                        writeChannel(channelRange[0], channelRange[1])
                    }
                />
            </Form.Label>
            <Slider
                id={sliderId}
                values={channelRange}
                range={{
                    min: nrfChannelsRange.min,
                    max: nrfChannelsRange.max,
                }}
                onChange={[
                    newValue =>
                        dispatch(setChannelRange([newValue, channelRange[1]])),
                    newValue =>
                        dispatch(setChannelRange([channelRange[0], newValue])),
                ]}
                onChangeComplete={() =>
                    writeChannel(channelRange[0], channelRange[1])
                }
            />
        </>
    );
};
