/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useCallback } from 'react';
import Form from 'react-bootstrap/Form';
import { useDispatch, useSelector } from 'react-redux';
import { NumberInlineInput, Slider } from 'pc-nrfconnect-shared';

import { setScanRepeat as setScanRepeatAction } from '../actions';
import { getScanRepeat } from '../reducer';
import { writeScanRepeat } from '../serialport';

const range = { min: 1, max: 100 };
const sliderId = 'sample-count-slider';

export default () => {
    const dispatch = useDispatch();
    const scanRepeat = useSelector(getScanRepeat);

    const setAndWriteScanRepeat = useCallback(
        newScanRepeat => {
            dispatch(setScanRepeatAction(newScanRepeat));
            writeScanRepeat(newScanRepeat);
        },
        [dispatch]
    );
    const setScanRepeat = useCallback(
        newScanRepeat => dispatch(setScanRepeatAction(newScanRepeat)),
        [dispatch]
    );

    return (
        <>
            <Form.Label htmlFor={sliderId}>
                Sample each channel{' '}
                <NumberInlineInput
                    value={scanRepeat}
                    range={range}
                    onChange={setAndWriteScanRepeat}
                />{' '}
                times
            </Form.Label>
            <Slider
                id={sliderId}
                values={[scanRepeat]}
                range={range}
                onChange={[setScanRepeat]}
                onChangeComplete={() => writeScanRepeat(scanRepeat)}
            />
        </>
    );
};
