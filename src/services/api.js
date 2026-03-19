import { handleNewIncident } from './ambulanceService';
import { getReports, getCenters, addReport } from './db';

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
            images: string[], // Array of Base64 or URLs
            videos: string[], // Array of Base64 or URLs
            audios: string[], // Array of Base64 or URLs
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
                lat: 24.72 + (Math.random() - 0.5) * 0.002, 
                lng: 46.68 + (Math.random() - 0.5) * 0.002 
            },
            description: "بلاغ تجريبي من التطبيق الخارجي user-app-hazel-beta!",
            images: ["https://www.transparenttextures.com/patterns/black-paper.png"], // Mock external image
            videos: [],
            audios: [],
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

window.simulateCVReport = () => {
    const reports = getReports();
    const centers = getCenters();
    const primaryCenter = centers[0];

    const report = {
        timestamp: new Date().toISOString(),
        status: 'جديد',
        location: { 
            lat: 24.71 + (Math.random() - 0.5) * 0.05, 
            lng: 46.67 + (Math.random() - 0.5) * 0.05 
        },
        description: '[رصد آلي]: إنذار تصادم، رصد أبخرة/دخان في الموقع',
        source: 'automated',
        missionStatus: 'pending',
        cameraId: 'CAM-' + Math.floor(100 + Math.random() * 900),
        images: ["https://images.unsplash.com/photo-1543353846-5be81ce4e211?q=80&w=400&auto=format&fit=crop"], 
        videos: [],
        audios: [],
        assignedCenterId: primaryCenter.id,
        involvedCenterIds: [primaryCenter.id],
        severity: 1
    };

    const newReport = addReport(report);
    console.log("Automated CV Report Simulated:", newReport);
    window.dispatchEvent(new Event('storage'));
    return newReport;
};

window.simulateDuplicateReport = () => {
    const reports = getReports().filter(r => r.missionStatus !== 'تم إنهاء المهمة');
    if (reports.length === 0) {
        alert("لا يوجد حوادث نشطة حالياً لتكرار البلاغ عليها. أضف بلاغاً أولاً.");
        return;
    }

    const target = reports[0];
    const names = ['عمر فاروق', 'ياسين علي', 'ليلى مراد', 'يوسف حسين'];
    const randomName = names[Math.floor(Math.random() * names.length)];

    const report = {
        timestamp: new Date().toISOString(),
        status: 'جديد',
        location: { ...target.location }, // Exact same location
        description: 'نفس الحادث - بلاغ تأكيدي من مواطن آخر',
        source: 'manual',
        sender: {
            fullName: randomName,
            nationalId: '1234567890',
            phone: '0500000000'
        },
        images: [
            "https://images.unsplash.com/photo-1563201515-ad694e9f90c6?q=80&w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1543085350-058074917d05?q=80&w=400&auto=format&fit=crop"
        ],
        videos: ["https://www.w3schools.com/html/mov_bbb.mp4"],
        audios: ["https://www.w3schools.com/html/horse.mp3"],
        assignedCenterId: target.assignedCenterId,
        involvedCenterIds: [target.assignedCenterId]
    };

    const result = addReport(report);
    console.log("Duplicate Report Simulated (Grouping should happen):", result);
    window.dispatchEvent(new Event('storage'));
    return result;
};
