/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useCallback } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useDispatch, useSelector } from 'react-redux';
import { InlineInput } from 'pc-nrfconnect-shared';

import { setOther as setOtherAction } from '../actions';
import { getIsConnected, getOther } from '../reducer';
import { writeOther } from '../serialport';

const sliderId = 'sample-other';

export default () => {
    const dispatch = useDispatch();
    const isConnected = useSelector(getIsConnected);
    const other = useSelector(getOther);

    const setOther = useCallback(
        newOther => {
            dispatch(setOtherAction(newOther));
        },
        [dispatch]
    );

    return (
        <Form.Label htmlFor={sliderId}>
            Input: {'  '}
            <InlineInput value={other} onChange={setOther} />
            <Button
                variant="secondary"
                disabled={!isConnected}
                onClick={() => {
                    dispatch(writeOther(other));
                }}
            >
                Send
            </Button>
        </Form.Label>
    );
};
