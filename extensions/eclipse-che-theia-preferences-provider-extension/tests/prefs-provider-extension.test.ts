import 'reflect-metadata';

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

import { PreferencesProvider } from '../src/browser/prefs-provider';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { PreferenceServiceImpl } from '@theia/core/lib/browser';
import { WorkspaceService } from '@theia/workspace/lib/browser';

let mockGetValue: any = jest.fn();
let mockGetWorkspace: any = jest.fn();
let mockSetPluginProperties: any = jest.fn();
let mockSetProperty: any = jest.fn();
let mockHasProperty: any = jest.fn();

let prefsProvider: PreferencesProvider;
beforeAll(() => {
    const envVariablesServer = {
        getVariables: jest.fn(),
        getValue: mockGetValue
    } as EnvVariablesServer;
    const preferenceServiceImpl = {
        has: mockHasProperty,
        set: mockSetProperty
    } as PreferenceServiceImpl;
    const workspaceService = {
        roots: jest.fn().mockResolvedValue({}),
        workspace: jest.fn().mockReturnValue({uri: 'workspace-uri'})
    } as WorkspaceService;
    prefsProvider = new PreferencesProvider(
        envVariablesServer,
        preferenceServiceImpl,
        workspaceService
    );
});

beforeEach(() => {
    mockGetValue.mockReset();
    mockGetWorkspace.mockReset();
    mockSetPluginProperties.mockReset();
    mockSetProperty.mockReset();
    mockHasProperty.mockReset();
});

const prefsExpectation = [
    ['java.jdt.ls.vmargs', '-noverify -Xmx1G -XX:+UseG1GC -XX:+UseStringDeduplication'],
    ['java.home', '/home/user/jdk11']
];

describe('PreferenceProvider', () => {

    test('should throw if there is no `CHE_WORKSPACE_ID` environment variable', async () => {
        mockGetValue.mockResolvedValue(undefined);

        await expect(prefsProvider.restorePluginProperties()).rejects.toThrow('Failed to get current workspace ID.');
    });

    test('should throw if `CHE_WORKSPACE_ID` is empty', async () => {
        mockGetValue
            .mockResolvedValue({
                name: 'CHE_WORKSPACE_ID'
            });

        await expect(prefsProvider.restorePluginProperties()).rejects.toThrow('Failed to get current workspace ID.');
    });

    test('should throw if there is no `CHE_API_EXTERNAL` environment variable', async () => {
        mockGetValue
            .mockResolvedValueOnce({
                name: 'CHE_WORKSPACE_ID',
                value: 'testworkspaceid'
            })
            .mockResolvedValueOnce(undefined);

        await expect(prefsProvider.restorePluginProperties()).rejects.toThrow('Failed to get Eclipse Che API endpoint.');
    });

    test('should throw if `CHE_API_EXTERNAL` is empty', async () => {
        mockGetValue
            .mockResolvedValueOnce({
                name: 'CHE_WORKSPACE_ID',
                value: 'testworkspaceid'
            })
            .mockResolvedValueOnce({
                name: 'CHE_API_EXTERNAL'
            });

        await expect(prefsProvider.restorePluginProperties()).rejects.toThrow('Failed to get Eclipse Che API endpoint.');
    });

    test('shold not overwrite an existing property', async () => {
        const skipedProperty = prefsExpectation[0][0];
        const expectedProperty = prefsExpectation[1][0];
        mockHasProperty.mockImplementation((propName: string) => {
            // let one of two properties is already exist in workspace scope
            if (propName === skipedProperty) {
                return true;
            }
        });

        await (<any>prefsProvider).setPluginProperties(prefsExpectation);

        expect(mockSetProperty.mock.calls.length).toEqual(1);
        expect(mockSetProperty.mock.calls[0][0]).toEqual(expectedProperty);
    });

    describe('in case of configuration based workspace, ', () => {

        const workspace = {
            namespace: 'che',
            id: 'testworkspaceid',
            status: 'RUNNING',
            config: {
                defaultEnv: 'default',
                environments: {},
                projects: [],
                name: 'test-workspace',
                attributes: {
                    editor: 'eclipse/che-theia/next',
                    editorComponentAlias: 'theia-editor',
                    plugins: 'eclipse/che-machine-exec-plugin/0.0.1,redhat/vscode-yaml/0.4.0,che-incubator/typescript/1.30.2',
                    'sidecar.che-incubator/typescript.memory_limit': '2048M',
                    'plugin.org.eclipse.che.vscode-redhat.java.preference.java.jdt.ls.vmargs': '-noverify -Xmx1G -XX:+UseG1GC -XX:+UseStringDeduplication',
                    'plugin.org.eclipse.che.vscode-redhat.java.preference.java.home': '/home/user/jdk11'
                },
                commands: [],
                links: []
            }
        };

        beforeEach(() => {
            (<any>prefsProvider).getWorkspace = mockGetWorkspace.mockResolvedValue(workspace);
            (<any>prefsProvider).setPluginProperties = jest.fn();
        });

        test('should retrieve preferences', async () => {
            await prefsProvider.restorePluginProperties();

            expect((<any>prefsProvider).setPluginProperties.mock.calls[0][0]).toEqual(prefsExpectation);
        });
    });

    describe('in case of devfile based workspace, ', () => {
        const workspace = {
            'namespace': 'che',
            'id': 'testworkspaceid',
            'status': 'RUNNING',
            'runtime': {},
            'devfile': {
                'specVersion': '0.0.1',
                'projects': [],
                'name': 'devfile-test',
                'attributes': {},
                'components': [
                    {
                        'mountSources': false,
                        'endpoints': [],
                        'command': [],
                        'id': 'eclipse/che-theia/next',
                        'args': [],
                        'selector': {},
                        'type': 'cheEditor',
                        'entrypoints': [],
                        'volumes': [],
                        'alias': 'theia-editor',
                        'env': []
                    },
                    {
                        'mountSources': false,
                        'endpoints': [],
                        'command': [],
                        'id': 'eclipse/che-machine-exec-plugin/0.0.1',
                        'args': [],
                        'selector': {},
                        'type': 'chePlugin',
                        'entrypoints': [],
                        'volumes': [],
                        'env': []
                    },
                    {
                        'mountSources': false,
                        'endpoints': [],
                        'command': [],
                        'id': 'redhat/java/0.38.0',
                        'args': [],
                        'selector': {},
                        'type': 'chePlugin',
                        'entrypoints': [],
                        'volumes': [],
                        'env': [],
                        'preferences': {
                            'java.jdt.ls.vmargs': '-noverify -Xmx1G -XX:+UseG1GC -XX:+UseStringDeduplication',
                            'java.home': '/home/user/jdk11'
                        }
                    }
                ],
                'commands': []
            }
        };

        beforeEach(() => {
            (<any>prefsProvider).getWorkspace = mockGetWorkspace.mockResolvedValue(workspace);
            (<any>prefsProvider).setPluginProperties = mockSetPluginProperties;
        });

        test('should retrieve preferences', async () => {
            await prefsProvider.restorePluginProperties();

            expect((<any>prefsProvider).setPluginProperties.mock.calls[0][0]).toEqual(prefsExpectation);
        });

    });

});
