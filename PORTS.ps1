# ============================================================
#   PORTS.ps1 — مرجع البورتات المثبتة لجميع الخدمات
#   هذا الملف هو المصدر الوحيد للحقيقة — لا تغيّر البورتات
#   في أي مكان آخر بدون تعديله هنا أولاً
# ============================================================

$PORTS = @{
    # ── ai-animation-factory ──────────────────────────────
    WebApp     = 3000   # Next.js frontend
    ApiServer  = 3001   # Express backend

    # ── Infrastructure ────────────────────────────────────
    Redis      = 6379   # Windows Service (auto-start)
    Supabase   = 54321  # Local Supabase (if running locally)

    # ── AI Microservices ──────────────────────────────────
    ComfyUI    = 8188   # Image generation  (ai_env Python 3.10)
    MediaVoice = 8000   # Audio/Voice/Dub   (mediavorice venv Python 3.10)

    # ── JackoLeeno Ops Dashboard ──────────────────────────
    JackOps    = 9000   # Internal ops dashboard (Next.js)

    # ── Optional ──────────────────────────────────────────
    Ollama     = 11434  # Local LLM
}

# Service URLs (derived from ports above)
$URLS = @{
    WebApp     = "http://localhost:$($PORTS.WebApp)"
    ApiServer  = "http://localhost:$($PORTS.ApiServer)"
    ApiHealth  = "http://localhost:$($PORTS.ApiServer)/api/health"
    ComfyUI    = "http://localhost:$($PORTS.ComfyUI)"
    MediaVoice = "http://localhost:$($PORTS.MediaVoice)"
    MediaDocs  = "http://localhost:$($PORTS.MediaVoice)/docs"
    JackOps    = "http://localhost:$($PORTS.JackOps)"
    Ollama     = "http://localhost:$($PORTS.Ollama)"
}
