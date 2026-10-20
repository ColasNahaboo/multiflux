// Saving an entry to a third-party service (linkding, Wallabag, ...) is a
// Miniflux integration: POST entries/{id}/save hands the entry to every
// enabled save integration and answers 202 with an empty body.
export function saveEntryPath(entryId) {
	return `entries/${encodeURIComponent(entryId)}/save`
}

export function integrationsStatusPath() {
	return 'integrations/status'
}

// Miniflux only offers its "Save" action when a save integration is enabled.
// Stay permissive when the status cannot be read: Miniflux versions older
// than 2.2.2 have no /v1/integrations/status endpoint.
export function saveIntegrationEnabled(status) {
	return status?.has_integrations !== false
}
