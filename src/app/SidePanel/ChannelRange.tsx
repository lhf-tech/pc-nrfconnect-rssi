/*
 * @文件路径         : \pc-nrfconnect-rssi\src\app\SidePanel\ChannelRange.tsx
 * @作者名称         : timetech
 * @创建日期         : 2024-04-23 14:20:53
 * @简要说明         : 
 */
/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    NumberInlineInput,
    Slider,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import {
    getChannelRange,
    setChannelRange,
    nrfChannelsRange,
} from '../../features/rssiDevice/rssiDeviceSlice';

export default () => {
    const dispatch = useDispatch();
    const channelRange = useSelector(getChannelRange);

    const min = Math.min(...channelRange);
    const max = Math.max(...channelRange);

    return (
        <div className="tw-flex tw-flex-col tw-gap-1">
            <div className="tw-flex tw-flex-row">
                Channels from{' '}
                <NumberInlineInput
                    value={min}
                    range={{ min: nrfChannelsRange.min, max }}
                    onChange={(newMin: number) =>
                        dispatch(setChannelRange([newMin, max]))
                    }
                />{' '}
                to{' '}
                <NumberInlineInput
                    value={max}
                    range={{ min, max: nrfChannelsRange.max }}
                    onChange={(newMax: number) =>
                        dispatch(setChannelRange([min, newMax]))
                    }
                />
            </div>
            <Slider
                values={channelRange}
                range={{ min: nrfChannelsRange.min, max: nrfChannelsRange.max }}
                onChange={[
                    newValue =>
                        dispatch(setChannelRange([newValue, channelRange[1]])),
                    newValue =>
                        dispatch(setChannelRange([channelRange[0], newValue])),
                ]}
            />
        </div>
    );
};
