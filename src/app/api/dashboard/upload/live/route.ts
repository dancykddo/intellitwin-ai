import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const files: any = await query('SELECT * FROM files ORDER BY created_at DESC');
    
    // 1. Calculate Statistics
    const totalFiles = files.length;
    
    // Calculate storage used (base 0.0 GB + parsed MBs)
    let extraStorageMB = 0;
    files.forEach((f: any) => {
      if (f.size) {
        const mbMatch = String(f.size).match(/(\d+(\.\d+)?)/);
        if (mbMatch) extraStorageMB += parseFloat(mbMatch[0]);
      }
    });
    const totalStorageGB = (extraStorageMB / 1024).toFixed(2) + " GB";

    // Files Uploaded Today
    const todayStr = new Date().toISOString().split('T')[0];
    const filesToday = files.filter((f: any) => {
      return f.created_at && new Date(f.created_at).toISOString().startsWith(todayStr);
    }).length;

    // Recent Uploads (last 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const recentUploads = files.filter((f: any) => {
      return f.created_at && new Date(f.created_at) > twoHoursAgo;
    }).length;

    return NextResponse.json({
      success: true,
      files: files.map((f: any) => ({
        ...f,
        date: f.created_at ? new Date(f.created_at).toLocaleString() : (f.date || 'Unknown'),
        analysis: f.analysis_json ? (typeof f.analysis_json === 'string' ? JSON.parse(f.analysis_json) : f.analysis_json) : null
      })),
      stats: {
        totalFiles,
        storageUsed: totalStorageGB,
        filesToday,
        recentUploads
      },
      lastUpdated: new Date().toLocaleTimeString()
    });
  } catch (error: any) {
    console.error("Dashboard Upload Live API Error:", error.message);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch dashboard upload metadata",
      files: [],
      stats: { totalFiles: 0, storageUsed: "0.00 GB", filesToday: 0, recentUploads: 0 },
      lastUpdated: new Date().toLocaleTimeString()
    });
  }
}
