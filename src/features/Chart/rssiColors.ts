/*
 * @文件路径         : \pc-nrfconnect-rssi\src\features\Chart\rssiColors.ts
 * @作者名称         : timetech
 * @创建日期         : 2024-04-23 14:20:53
 * @简要说明         : 
 */
/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { colors } from '@nordicsemiconductor/pc-nrfconnect-shared';

export default {
    label: colors.gray300,
    bar: {
        normal: colors.blueSlate,
        normalMax: colors.blueSlateLighter,
        advertisement: colors.gray900,
        advertisementMax: colors.red,
        extend: colors.deepPurple,
        extendMax: colors.purple,
        extend2: colors.green,
        extendMax2: colors.lightGreen,
        background: colors.gray50,
    },
};
