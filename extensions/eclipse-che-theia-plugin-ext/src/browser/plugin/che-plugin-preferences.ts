/********************************************************************************
 * Copyright (C) 2019 Red Hat, Inc. and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { interfaces } from 'inversify';
import {
    createPreferenceProxy,
    PreferenceProxy,
    PreferenceService,
    PreferenceSchema,
    PreferenceContribution
} from '@theia/core/lib/browser/preferences';

export const chePluginPreferenceSchema: PreferenceSchema = {
    'type': 'object',
    'properties': {
        'chePlugins.repositories': {
            'description': 'Custom plugin repositories',
            'type': 'object',
            'default': {}
        }
    }
};

export interface ChePluginPreferenceConfiguration {
    'chePlugins.repositories': { [name: string]: string };
}

export const ChePluginPreferences = Symbol('ChePluginPreferences');
export type ChePluginPreferences = PreferenceProxy<ChePluginPreferenceConfiguration>;

export function createChePluginPreferences(preferences: PreferenceService): ChePluginPreferences {
    return createPreferenceProxy(preferences, chePluginPreferenceSchema);
}

export function bindChePluginPreferences(bind: interfaces.Bind): void {
    bind(ChePluginPreferences).toDynamicValue(ctx => {
        const preferences = ctx.container.get<PreferenceService>(PreferenceService);
        return createChePluginPreferences(preferences);
    }).inSingletonScope();

    bind(PreferenceContribution).toConstantValue({ schema: chePluginPreferenceSchema });
}
