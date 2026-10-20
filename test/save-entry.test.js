import test from 'node:test'
import assert from 'node:assert/strict'
import {
	saveEntryPath,
	integrationsStatusPath,
	saveIntegrationEnabled,
} from '../src/lib/saveEntry.js'

test('save requests use the Miniflux third-party save endpoint', () => {
	assert.equal(saveEntryPath(42), 'entries/42/save')
	assert.equal(saveEntryPath(98937), 'entries/98937/save')
	assert.equal(integrationsStatusPath(), 'integrations/status')
})

test('the save action is offered when Miniflux has a save integration', () => {
	assert.equal(saveIntegrationEnabled({ has_integrations: true }), true)
	assert.equal(saveIntegrationEnabled({ has_integrations: false }), false)
})

test('the save action stays available when the status is unknown', () => {
	assert.equal(saveIntegrationEnabled(null), true)
	assert.equal(saveIntegrationEnabled(undefined), true)
	assert.equal(saveIntegrationEnabled({}), true)
})
