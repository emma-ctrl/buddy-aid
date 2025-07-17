import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zgacgczcukfjnomiewuc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnYWNnY3pjdWtmam5vbWlld3VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NzYxMTEsImV4cCI6MjA2ODM1MjExMX0.qam8VnPDMcpFrSTPGmswSMbOAERfLw-q_pCdI58afNQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)