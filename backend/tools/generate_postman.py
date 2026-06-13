"""
Generate a Postman v2.1 collection from Laravel's route list, organised by
PLATFORM (Mobile App / Web Dashboards) and then by USER ROLE so each team
member opens only their own folder.

    php artisan route:list --json > storage/app/routes.json
    python tools/generate_postman.py

Outputs (in the backend/ root):
    ABCDE_API.postman_collection.json
    ABCDE_API.postman_environment.json
"""
import copy
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROUTES = os.path.join(ROOT, "storage", "app", "routes.json")

SERIAL = "ALM-20413"
TICKET = "%23ALM-20413"  # "#ALM-20413" url-encoded

# ---- Folder tree (top group -> ordered sub-folders / roles) ----
ROLE = {
    "auth": ("🔑 Shared", "Auth & Session"),
    "guest": ("📱 Mobile App", "Guest / Public"),
    "patient": ("📱 Mobile App", "Patient"),
    "family": ("📱 Mobile App", "Family"),
    "reception": ("🖥️ Web Dashboards", "Reception"),
    "nurse": ("🖥️ Web Dashboards", "Nurse"),
    "doctor": ("🖥️ Web Dashboards", "Doctor"),
    "quality": ("🖥️ Web Dashboards", "Quality"),
    "director": ("🖥️ Web Dashboards", "Director"),
    "emergency": ("🖥️ Web Dashboards", "Emergency"),
    "admin": ("🖥️ Web Dashboards", "Admin"),
}
GROUP_ORDER = ["🔑 Shared", "📱 Mobile App", "🖥️ Web Dashboards"]
SUB_ORDER = {
    "🔑 Shared": ["Auth & Session"],
    "📱 Mobile App": ["Guest / Public", "Patient", "Family"],
    "🖥️ Web Dashboards": ["Reception", "Nurse", "Doctor", "Quality", "Director", "Emergency", "Admin"],
}

# Each endpoint -> the role folder(s) where it belongs. Shared read endpoints
# are listed under every role that consumes them.
PLACE = {
    "GET health": ["auth"],
    "POST auth/login": ["auth"],
    "POST auth/login/qr": ["auth"],
    "POST auth/logout": ["auth"],
    "GET auth/me": ["auth"],

    # Mobile · Guest / Public
    "POST patients/register": ["guest"],
    "GET public/hospital": ["guest"],
    "GET public/departments": ["guest"],
    "GET public/doctors": ["guest"],
    "GET public/news": ["guest"],
    "GET appointments/slots": ["guest"],
    "GET nav/map": ["guest"],
    "GET nav/search": ["guest"],
    "GET nav/route": ["guest"],

    # Mobile · Patient
    "POST appointments": ["guest", "patient"],
    "GET appointments": ["patient", "reception"],
    "PATCH appointments/{id}/reschedule": ["patient"],
    "DELETE appointments/{id}": ["patient"],
    "GET patients/{serial}": ["patient", "reception"],
    "PUT patients/{serial}/preferences": ["patient"],
    "GET patients/{serial}/accessibility": ["patient"],
    "PUT patients/{serial}/accessibility": ["patient"],
    "GET patients/{serial}/care-points": ["patient"],
    "GET patients/{serial}/insurance": ["patient", "reception"],
    "GET visits/{id}": ["patient", "family", "doctor", "nurse"],
    "GET visits/{id}/vitals": ["patient", "nurse", "doctor"],
    "GET visits/{id}/prescriptions": ["patient", "doctor", "nurse"],
    "POST prescriptions/{id}/administer": ["patient", "nurse"],
    "GET visits/{id}/results": ["patient", "doctor"],
    "GET visits/{id}/financial-file": ["patient", "reception"],
    "POST visits/{id}/payments": ["patient", "reception"],
    "POST assistant/ask": ["patient", "family"],
    "POST assistant/triage": ["patient"],
    "POST emergency/sos": ["patient", "family"],
    "GET notifications": ["patient", "family"],
    "POST notifications/{id}/read": ["patient", "family"],
    "POST patients/{serial}/family": ["patient"],
    "GET patients/{serial}/family": ["patient", "family"],
    "PATCH family/{id}/permissions": ["patient"],
    "DELETE family/{id}": ["patient"],
    "POST stages/{id}/feedback": ["patient", "family"],
    "POST complaints": ["patient"],
    "GET education/videos": ["patient", "family"],
    "GET education/relax": ["patient"],
    "POST consents/{id}/respond": ["patient", "family"],
    "POST documentation/translate": ["patient", "doctor"],

    # Mobile · Family
    "POST family/{id}/accept": ["family"],

    # Web · Reception
    "GET patients": ["reception"],
    "POST patients/{serial}/cards": ["reception"],
    "POST patients/{serial}/qr": ["reception"],
    "PATCH patients/{serial}/insurance": ["reception"],
    "POST visits": ["reception"],
    "PATCH appointments/{id}/status": ["reception"],
    "POST appointments/{id}/assign": ["reception", "director"],
    "POST visits/{id}/billing/committee-review": ["reception"],
    "POST visits/{id}/committee": ["reception", "doctor"],
    "POST committee/{id}/authorize": ["reception", "doctor"],

    # Web · Nurse
    "POST visits/{id}/triage": ["nurse"],
    "POST visits/{id}/vitals": ["nurse"],
    "POST visits/{id}/checklists": ["nurse"],
    "POST visits/{id}/transport": ["nurse"],
    "POST visits/{id}/risk-score/recompute": ["nurse", "doctor"],
    "POST visits/{id}/reconciliation": ["nurse", "doctor"],
    "POST emergency/code-blue": ["nurse", "emergency"],

    # Web · Doctor
    "GET visits": ["doctor", "nurse", "reception"],
    "POST visits/{id}/advance": ["doctor", "nurse"],
    "POST visits/{id}/cath-type": ["doctor"],
    "GET visits/{id}/care-plan": ["doctor", "nurse"],
    "POST visits/{id}/care-plan": ["doctor"],
    "POST visits/{id}/consents": ["doctor"],
    "GET visits/{id}/risk-score": ["doctor", "nurse"],
    "POST visits/{id}/vte": ["doctor"],
    "PUT visits/{id}/thresholds": ["doctor"],
    "POST visits/{id}/prescriptions": ["doctor"],
    "GET pharmacy/availability": ["doctor", "nurse"],
    "POST visits/{id}/orders": ["doctor"],
    "GET visits/{id}/orders": ["doctor", "nurse"],
    "POST orders/{id}/result": ["doctor"],
    "POST visits/{id}/diagnosis": ["doctor"],
    "GET patients/{serial}/file": ["doctor"],
    "POST visits/{id}/consultations": ["doctor"],
    "POST documentation/draft": ["doctor"],
    "POST documentation/{draftId}/approve": ["doctor"],
    "POST documentation/transcribe": ["doctor"],

    # Web · Quality
    "GET complaints": ["quality"],
    "PATCH complaints/{id}": ["quality"],
    "GET feedback": ["quality"],
    "GET quality/dashboard": ["quality", "director"],

    # Web · Director
    "GET reports/kpis": ["director", "quality"],
    "GET reports/monthly": ["director"],
    "GET emergency/metrics": ["emergency", "director"],

    # Web · Emergency
    "GET emergency/active": ["emergency"],
    "POST emergency/{id}/answer": ["emergency"],
    "POST emergency/{id}/advance": ["emergency"],

    # Web · Admin
    "POST admin/users": ["admin"],
    "GET admin/users": ["admin"],
    "PATCH admin/users/{id}/role": ["admin"],
    "GET admin/permissions": ["admin"],
    "POST admin/import": ["admin"],
    "POST admin/import/seed": ["admin"],
    "GET admin/audit": ["admin"],
    "GET admin/integrations": ["admin"],
    "GET admin/ai-models": ["admin"],
}

PUBLIC = {
    "GET health", "POST auth/login", "POST auth/login/qr", "POST patients/register",
    "GET public/hospital", "GET public/departments", "GET public/doctors", "GET public/news",
    "GET appointments/slots", "GET nav/map", "GET nav/search", "GET nav/route",
}

# Feature sub-folders shown inside each role folder, in this order.
FEATURE_ORDER = [
    "Auth & Session", "Public Portal", "Navigation", "Profile & Settings",
    "Appointments", "Care Journey", "Vitals & Risk", "Medications",
    "Diagnostics & Records", "AI Assistant", "Notifications", "Emergency & Alerts",
    "Family & Caregiver", "Billing & Insurance", "Feedback & Quality",
    "Education & Loyalty", "Reports & KPIs", "Admin & Users", "Data Import",
]


def feature_for(rel):
    """Map an endpoint to its feature sub-folder."""
    checks = [
        ("Data Import", lambda: rel.startswith("admin/import")),
        ("Admin & Users", lambda: rel.startswith("admin/")),
        ("Reports & KPIs", lambda: rel.startswith("reports/")),
        ("Auth & Session", lambda: rel == "health" or rel.startswith("auth")),
        ("Public Portal", lambda: rel.startswith("public/")),
        ("Navigation", lambda: rel.startswith("nav/")),
        ("Appointments", lambda: rel.startswith("appointments")),
        ("Family & Caregiver", lambda: rel.startswith("family/") or rel.endswith("/family")),
        ("Education & Loyalty", lambda: rel.startswith("education/") or rel.endswith("care-points")),
        ("Billing & Insurance", lambda: rel.endswith("/insurance") or "billing" in rel or rel.endswith("financial-file") or rel.endswith("/payments")),
        ("Feedback & Quality", lambda: rel.startswith("stages/") or rel.startswith("complaints") or rel == "feedback" or rel.startswith("quality/")),
        ("Notifications", lambda: rel.startswith("notifications")),
        ("Emergency & Alerts", lambda: rel.startswith("emergency/")),
        ("AI Assistant", lambda: rel.startswith("assistant/") or rel.startswith("documentation/")),
        ("Vitals & Risk", lambda: rel.endswith("/vitals") or "risk-score" in rel or rel.endswith("/vte") or rel.endswith("/thresholds")),
        ("Medications", lambda: rel.endswith("prescriptions") or rel.startswith("prescriptions/") or rel.endswith("reconciliation") or rel.startswith("pharmacy")),
        ("Diagnostics & Records", lambda: rel.endswith("/file") or rel.endswith("/orders") or rel.startswith("orders/") or rel.endswith("/results") or rel.endswith("/diagnosis") or rel.endswith("/consultations")),
        ("Care Journey", lambda: rel.startswith("visits") or rel.startswith("committee/") or rel.startswith("consents/")),
        ("Profile & Settings", lambda: rel.startswith("patients")),
    ]
    for name, test in checks:
        if test():
            return name
    return "Other"

BODIES = {
    "POST auth/login": {"identifier": "k.adel@alamein.example", "password": "password"},
    "POST auth/login/qr": {"qr_token": "QR-XXXXXXXXXX"},
    "POST patients/register": {"full_name": "New Patient", "national_id": "29001011234567", "date_of_birth": "1990-01-01", "gender": "M", "phone": "010-1234-5678", "city_district": "New Alamein", "preferred_language": "ar", "decision_maker": "self", "chronic_conditions": "", "password": "password"},
    "PUT patients/{serial}/preferences": {"preferred_language": "en", "decision_maker": "self", "phone": "010-0000-0001", "city_district": "Marsa Matrouh"},
    "POST patients/{serial}/cards": {"card_type": "arrival"},
    "PUT patients/{serial}/accessibility": {"high_contrast": True, "screen_reader": False, "text_to_speech": True, "captions": False, "haptics": True, "simple_mode": False, "font_scale": 1.5},
    "POST appointments": {"dept_code": "CARD", "complaint": "Chest discomfort on exertion", "guest_name": "Nour Adel", "guest_phone": "010-0000-0009"},
    "PATCH appointments/{id}/reschedule": {"scheduled_at": "2026-06-20 11:00"},
    "PATCH appointments/{id}/status": {"status": "approved", "scheduled_at": "2026-06-20 11:00"},
    "POST appointments/{id}/assign": {"assigned_doctor_id": "D-001"},
    "POST visits": {"patient_serial": SERIAL, "arrival_type": "emergency", "dept_code": "CARD", "location_code": "ER-1"},
    "POST visits/{id}/triage": {"triage_classification": "critical", "dept_code": "CARD", "location_code": "CATH-1", "note": "Direct ER pathway"},
    "POST visits/{id}/advance": {"stage": "cath", "note": "Primary PCI", "balloon_time": "2026-06-08 09:26"},
    "POST visits/{id}/cath-type": {"catheterization_type": "cardiac"},
    "POST visits/{id}/care-plan": {"problem_list": "STEMI; HTN; T2DM", "plan": "DAPT, statin, cardiac rehab", "outcomes": "Stable", "timeframe": "3 months"},
    "POST visits/{id}/consents": {"item": "Cardiac catheterization (primary PCI)"},
    "POST consents/{id}/respond": {"decision": "given", "responded_by": "Mariam Al-Rashid (decision-maker)"},
    "POST visits/{id}/checklists": {"record_type": "surgical_timeout", "item": "Identity, procedure and site verified", "decision": "completed"},
    "POST visits/{id}/transport": {"from_location": "CATH-1", "to_location": "W-B7", "monitoring": ["ECG", "SpO2"]},
    "POST visits/{id}/committee": {"review_type": "direct_admission", "reason": "Life-threatening STEMI", "members": ["D-001", "D-002", "D-003"]},
    "POST committee/{id}/authorize": {"decision": "authorized", "memo": "Direct admission approved"},
    "POST visits/{id}/vitals": {"systolic_bp": 168, "diastolic_bp": 95, "pulse": 112, "respiratory_rate": 24, "spo2": 91, "temperature": 37.1, "pain_score": 8, "consciousness_avpu": "A"},
    "POST visits/{id}/vte": {"factors": [{"factor": "Reduced mobility", "points": 3}, {"factor": "Active cancer", "points": 3}]},
    "PUT visits/{id}/thresholds": {"systolic_bp_min": 90, "systolic_bp_max": 180, "pulse_min": 50, "pulse_max": 120, "spo2_min": 92},
    "POST visits/{id}/prescriptions": {"drug_name": "Aspirin", "dose": "75 mg", "route": "PO", "frequency": "once daily", "duration_days": 90, "patient_instructions": "One tablet daily after food"},
    "POST prescriptions/{id}/administer": {"action": "given", "scheduled_time": "2026-06-08 21:00", "actual_time": "2026-06-08 21:05", "note": ""},
    "POST visits/{id}/reconciliation": {"home_medications": ["Metformin", "Aspirin"], "note": "Reconciled on admission"},
    "POST visits/{id}/orders": {"order_type": "lab", "detail": "Troponin I, CK-MB"},
    "POST orders/{id}/result": {"result_summary": "Troponin I 2.8 ng/mL (H)", "status": "resulted"},
    "POST visits/{id}/diagnosis": {"icd10_code": "I21.19", "diagnosis": "Inferior STEMI", "is_primary": True},
    "POST visits/{id}/consultations": {"specialty": "Endocrinology", "question": "Glycaemic management peri-PCI"},
    "POST assistant/ask": {"question": "What should I avoid after my stent?", "context": "post-PCI"},
    "POST assistant/triage": {"symptoms": "chest pain and shortness of breath"},
    "POST documentation/draft": {"ticket_no": "#ALM-20413", "doc_type": "discharge_summary"},
    "POST documentation/{draftId}/approve": {"content": "Approved discharge summary text."},
    "POST documentation/transcribe": {"transcript": "Patient stable, vitals within range."},
    "POST documentation/translate": {"text": "Take one tablet daily after food.", "target": "zh"},
    "POST emergency/sos": {"ticket_no": "#ALM-20413", "location": "Ward B - Bed 7"},
    "POST emergency/code-blue": {"ticket_no": "#ALM-20413", "location": "Ward B - Bed 7"},
    "POST emergency/{id}/answer": {"answered_by": "Nursing station", "classification": "real_emergency", "resolve": True},
    "POST emergency/{id}/advance": {"step": "nursing"},
    "POST patients/{serial}/family": {"companion_name": "Mariam Al-Rashid", "relation": "daughter", "companion_phone": "010-0000-0003", "can_see_status": True, "receives_alerts": True, "can_book": True, "can_rate": True, "can_raise_emergency": True, "is_decision_maker": True},
    "PATCH family/{id}/permissions": {"can_see_status": True, "receives_alerts": True, "can_book": False, "can_rate": True, "can_raise_emergency": False, "is_decision_maker": False},
    "PATCH patients/{serial}/insurance": {"coverage_category": "insured", "payer_name": "Health Insurance Authority", "policy_no": "HIA-99887", "determined_from": "national_id", "notes": ""},
    "POST visits/{id}/billing/committee-review": {"reason": "Unable to pay; refer to funding committee"},
    "POST visits/{id}/payments": {"amount": 850, "method": "cash", "reference": "RCP-0001"},
    "POST stages/{id}/feedback": {"stars": 5, "comment": "Very fast response on arrival"},
    "POST complaints": {"ticket_no": "#ALM-20413", "stage": "recovery", "complaint_text": "Pain not addressed quickly enough", "routed_to_dept": "CARD"},
    "PATCH complaints/{id}": {"status": "responded", "routed_to_dept": "CARD"},
    "POST admin/users": {"name": "Tasnem H.", "email": "t.h@alamein.example", "username": "t.h@alamein.example", "role": "doctor", "staff_id": "D-009", "password": "password", "locale": "en"},
    "PATCH admin/users/{id}/role": {"role": "director", "is_active": True},
    "POST admin/import/seed": {"password": "password"},
}


def example_path(uri):
    segs = uri.split("/")
    out = []
    for i, s in enumerate(segs):
        if not (s.startswith("{") and s.endswith("}")):
            out.append(s)
            continue
        prev = segs[i - 1] if i else ""
        if s == "{serial}":
            out.append(SERIAL)
        elif prev == "visits":
            out.append(TICKET)
        elif prev == "appointments":
            out.append("APT-1001")
        elif prev == "emergency":
            out.append("E-9001")
        elif prev == "complaints":
            out.append("C-3001")
        else:
            out.append("1")
    return out


def make_request(method, rel, sig):
    is_public = sig in PUBLIC
    headers = [{"key": "Accept", "value": "application/json"}]
    req = {"method": method, "header": headers}
    if is_public:
        req["auth"] = {"type": "noauth"}

    if rel == "admin/import":
        req["body"] = {"mode": "formdata", "formdata": [
            {"key": "file", "type": "file", "src": "../db/ABCDE_Data_1_Hospital_Master.xlsx"},
        ]}
    else:
        body = BODIES.get(sig)
        if body is not None:
            headers.append({"key": "Content-Type", "value": "application/json"})
            req["body"] = {"mode": "raw", "raw": json.dumps(body, indent=2, ensure_ascii=False),
                           "options": {"raw": {"language": "json"}}}

    path = example_path(rel)
    req["url"] = {"raw": "{{baseUrl}}/" + "/".join(path), "host": ["{{baseUrl}}"], "path": path}

    item = {"name": f"{method} /{rel}", "request": req}
    if sig in ("POST auth/login", "POST auth/login/qr"):
        item["event"] = [{"listen": "test", "script": {"type": "text/javascript", "exec": [
            "var d = pm.response.json();",
            "if (d && d.data && d.data.token) {",
            "  pm.collectionVariables.set('token', d.data.token);",
            "  console.log('Saved token for role: ' + d.data.user.role);",
            "}",
        ]}}]
    return item


def main():
    routes = json.load(open(ROUTES, encoding="utf-8"))
    api = [(r["method"].split("|")[0], r["uri"][len("api/v1/"):]) for r in routes if r["uri"].startswith("api/v1")]

    # tree[group][role][feature] = [items]
    tree = {g: {s: {} for s in SUB_ORDER[g]} for g in GROUP_ORDER}
    missing = []
    for method, rel in sorted(api, key=lambda t: t[1]):
        sig = f"{method} {rel}"
        roles = PLACE.get(sig)
        if not roles:
            missing.append(sig)
            continue
        base = make_request(method, rel, sig)
        feature = feature_for(rel)
        for role in roles:
            group, sub = ROLE[role]
            tree[group][sub].setdefault(feature, []).append(copy.deepcopy(base))

    if missing:
        print("WARNING — unplaced endpoints:", missing)

    items = []
    for g in GROUP_ORDER:
        role_folders = []
        for s in SUB_ORDER[g]:
            features = tree[g][s]
            if not features:
                continue
            # Shared/Auth stays flat; every other role gets feature sub-folders.
            if g == "🔑 Shared":
                requests = [it for f in FEATURE_ORDER for it in features.get(f, [])]
                role_folders.append({"name": s, "item": requests})
            else:
                feat_folders = [
                    {"name": f, "item": features[f]}
                    for f in FEATURE_ORDER if f in features
                ]
                role_folders.append({"name": s, "item": feat_folders})
        items.append({"name": g, "item": role_folders})

    collection = {
        "info": {
            "name": "A.B.C.D.E Healthcare API (v1) — by Platform & Role",
            "description": "Organised by platform (Mobile App / Web Dashboards) then by user role, "
                           "so each team member uses only their folder. Shared read endpoints appear "
                           "under every role that consumes them. Run Shared › Login first to capture "
                           "the bearer token. Add ?lang=ar|ru|zh to any request for a localized response. "
                           "Note: ticket_no's '#' is URL-encoded as %23 in example paths.",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        },
        "auth": {"type": "bearer", "bearer": [{"key": "token", "value": "{{token}}", "type": "string"}]},
        "variable": [
            {"key": "baseUrl", "value": "http://127.0.0.1:8000/api/v1"},
            {"key": "token", "value": ""},
            {"key": "serial", "value": SERIAL},
            {"key": "ticket", "value": "#ALM-20413"},
        ],
        "item": items,
    }

    env = {
        "name": "ABCDE Local",
        "values": [
            {"key": "baseUrl", "value": "http://127.0.0.1:8000/api/v1", "enabled": True},
            {"key": "token", "value": "", "enabled": True},
        ],
        "_postman_variable_scope": "environment",
    }

    out_c = os.path.join(ROOT, "ABCDE_API.postman_collection.json")
    out_e = os.path.join(ROOT, "ABCDE_API.postman_environment.json")
    json.dump(collection, open(out_c, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
    json.dump(env, open(out_e, "w", encoding="utf-8"), indent=2, ensure_ascii=False)

    placed = sum(len(items_) for g in tree for s in tree[g] for items_ in tree[g][s].values())
    print(f"{len(api)} routes -> {placed} request entries (shared endpoints duplicated per role)")
    for g in GROUP_ORDER:
        for s in SUB_ORDER[g]:
            features = tree[g][s]
            if not features:
                continue
            total = sum(len(v) for v in features.values())
            feats = ", ".join(f"{f}({len(features[f])})" for f in FEATURE_ORDER if f in features)
            print(f"  {g} / {s} [{total}]: {feats}")
    print("  ->", out_c)


if __name__ == "__main__":
    main()
