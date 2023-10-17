import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jjcfohwqmyqjbshlbbez.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqY2ZvaHdxbXlxamJzaGxiYmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTU3NDc2OTEsImV4cCI6MjAxMTMyMzY5MX0.XCHmbCqBFSQmyYhPUUYav0KUkMWTxT1z7mzd2GIr6bM";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
