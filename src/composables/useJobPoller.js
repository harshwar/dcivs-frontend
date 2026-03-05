import { ref, onBeforeUnmount } from 'vue'
import { API_BASE_URL } from '../apiConfig'

/**
 * useJobPoller — Reusable Vue composable for polling background job progress.
 * 
 * Usage:
 *   const { job, startPolling, stopPolling } = useJobPoller()
 *   startPolling(jobId)  // begins polling every ~2.5s
 *   // job.value = { status, current_step, step_label, percentage, result, error }
 *   // automatically stops on 'completed' or 'failed'
 */
export function useJobPoller() {
    const job = ref(null)
    const isPolling = ref(false)
    let intervalId = null

    async function fetchStatus(jobId) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/job-status/${jobId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
                }
            })
            if (res.ok) {
                const data = await res.json()
                job.value = data

                // Auto-stop when the job finishes
                if (data.status === 'completed' || data.status === 'failed') {
                    stopPolling()
                }
            }
        } catch (err) {
            console.error('[useJobPoller] Poll error:', err)
        }
    }

    /**
     * Start polling a job's status.
     * @param {string} jobId - UUID of the background job
     * @param {number} intervalMs - Polling interval in ms (default 2500)
     */
    function startPolling(jobId, intervalMs = 2500) {
        stopPolling() // Clear any existing interval
        job.value = null
        isPolling.value = true

        // Fetch immediately, then set interval
        fetchStatus(jobId)
        intervalId = setInterval(() => fetchStatus(jobId), intervalMs)
    }

    /** Stop polling and clear the interval. */
    function stopPolling() {
        if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
        }
        isPolling.value = false
    }

    /** Reset the poller state entirely. */
    function reset() {
        stopPolling()
        job.value = null
    }

    // Auto-cleanup when the component unmounts
    onBeforeUnmount(stopPolling)

    return { job, isPolling, startPolling, stopPolling, reset }
}
