import { handleNewIncident } from './ambulanceService';

// This service is meant to integrate with the external user app (https://user-app-hazel-beta.vercel.app/)
// In a real scenario, this would poll a backend, use websockets, or be at the receiving end of a webhook.

// Mock scenario: We expose a global function that allows external scripts to send data to our app.
// It also simulates a poll.

export const integrateExternalAPI = (onNewReportReceived) => {
    
    // Method 1: Global Window Function (Webhook Simulation)
    // The external application could theoretically post a message to this window 
    // or call this if embedded.
    window.receiveExternalAccidentReport = (reportPayload) => {
        /*
          Expected Payload Format:
          {
            location: { lat: number, lng: number },
            description: string,
            requiredAmbulances: number,
            image: string | null, // Base64 or URL
            timestamp: string,
            sender: {
                fullName: string,
                nationalId: string,
                phone: string,
                photo: string | null // Base64 or URL
            }
          }
        */
        console.log("Received simulated external report: ", reportPayload);
        
        // 1. Process Report (Find nearest center, log to DB)
        const result = handleNewIncident(reportPayload);
        
        // 2. Notify UI to refresh
        if (onNewReportReceived) {
            onNewReportReceived(result);
        }
        
        return { success: true, assignedCenter: result.nearestCenter.name };
    };

    // Method 2: Simulated Polling
    // Assuming the external user app relies on an API like Firebase/Supabase, 
    // you would replace the interval logic below with a query like:
    // supabase.from('reports').select('*').eq('status', 'new')
    
    /*
    const pollInterval = setInterval(async () => {
        try {
            // const response = await fetch('https://api.your-backend.com/reports/new');
            // const newReports = await response.json();
            // newReports.forEach(report => {
            //      const result = handleNewIncident(report);
            //      onNewReportReceived(result);
            // });
        } catch (error) {
            console.error("Error polling for external reports:", error);
        }
    }, 10000);
    
    return () => {
        clearInterval(pollInterval);
        delete window.receiveExternalAccidentReport;
    };
    */

    return () => {
        delete window.receiveExternalAccidentReport;
    }
};

// Helper for testing the integration from console
window.simulateExternalAppReport = () => {
    if (window.receiveExternalAccidentReport) {
        window.receiveExternalAccidentReport({
            location: { 
                lat: 24.72 + (Math.random() - 0.5) * 0.1, 
                lng: 46.68 + (Math.random() - 0.5) * 0.1 
            },
            description: "بلاغ تجريبي من التطبيق الخارجي user-app-hazel-beta!",
            image: "https://www.transparenttextures.com/patterns/black-paper.png", // Mock external image
            timestamp: new Date().toISOString(),
            sender: {
                fullName: "أحمد بن عبدالله",
                nationalId: "1023456789",
                phone: "0501234567",
                photo: "https://i.pravatar.cc/150?u=ahmed"
            }
        });
    } else {
        console.warn("API Listener is not currently mounted.");
    }
};
