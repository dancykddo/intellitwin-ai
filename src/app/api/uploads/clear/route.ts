import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST() {
  try {
    // Delete all records from related tables
    await supabaseAdmin.from("uploads").delete().neq("id", "");
    await supabaseAdmin.from("planner").delete().neq("id", "");
    await supabaseAdmin.from("modules").delete().neq("id", "");
    await supabaseAdmin.from("qna").delete().neq("id", "");

    return Response.json({ success: true, message: "All data cleared successfully." });
  } catch (error: any) {
    console.error("[API/Uploads/Clear] Error:", error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
