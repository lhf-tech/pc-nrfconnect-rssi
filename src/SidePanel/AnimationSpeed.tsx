/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useCallback } from 'react';
import Form from 'react-bootstrap/Form';
import { useDispatch, useSelector } from 'react-redux';
import { NumberInlineInput, Slider } from 'pc-nrfconnect-shared';

import { setAnimationDuration as setAnimationDurationAction } from '../actions';
import { getAnimationDuration } from '../reducer';

const range = { min: 10, max: 10000 };
const sliderId = 'animation-duration-slider';

export default () => {
    const dispatch = useDispatch();
    const animationDuration = useSelector(getAnimationDuration);

    const setAnimationDuration = useCallback(
        newAnimationDuration =>
            dispatch(setAnimationDurationAction(newAnimationDuration)),
        [dispatch]
    );

    return (
        <>
            <Form.Label htmlFor={sliderId}>
                Hold values for{' '}
                <NumberInlineInput
                    value={animationDuration}
                    range={range}
                    onChange={setAnimationDuration}
                />
                &nbsp;ms
            </Form.Label>
            <Slider
                id={sliderId}
                values={[animationDuration]}
                range={range}
                onChange={[setAnimationDuration]}
            />
        </>
    );
};
