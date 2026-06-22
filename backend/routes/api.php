<?php

use App\Http\Controllers\Api\V1\AdminContentController;
use App\Http\Controllers\Api\V1\AdminController;
use App\Http\Controllers\Api\V1\AppointmentController;
use App\Http\Controllers\Api\V1\AssistantController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BillingController;
use App\Http\Controllers\Api\V1\CommitteeController;
use App\Http\Controllers\Api\V1\ConsentController;
use App\Http\Controllers\Api\V1\DiagnosticsController;
use App\Http\Controllers\Api\V1\EducationController;
use App\Http\Controllers\Api\V1\EmergencyController;
use App\Http\Controllers\Api\V1\FamilyController;
use App\Http\Controllers\Api\V1\ImportController;
use App\Http\Controllers\Api\V1\MedicationController;
use App\Http\Controllers\Api\V1\NavController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\PatientController;
use App\Http\Controllers\Api\V1\PublicController;
use App\Http\Controllers\Api\V1\QualityController;
use App\Http\Controllers\Api\V1\RatingController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\SuggestionController;
use App\Http\Controllers\Api\V1\TransportController;
use App\Http\Controllers\Api\V1\UserActionController;
use App\Http\Controllers\Api\V1\VisitController;
use App\Http\Controllers\Api\V1\VitalsController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    Route::get('/health', fn () => response()->json([
        'service' => 'ABCDE Healthcare API',
        'version' => 'v1',
        'status' => 'ok',
        'locale' => app()->getLocale(),
        'supported_languages' => config('i18n.names'),
        'rtl_languages' => config('i18n.rtl'),
    ]));

    /* ---------------------------------------------------------------------
     | Public (no authentication)
     * --------------------------------------------------------------------*/
    // S1 — Auth & registration
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/login/qr', [AuthController::class, 'loginQr']);

    // S2 — Public portal
    Route::get('/public/hospital', [PublicController::class, 'hospital']);
    Route::get('/public/departments', [PublicController::class, 'departments']);
    Route::get('/public/doctors', [PublicController::class, 'doctors']);
    Route::get('/public/news', [PublicController::class, 'news']);
    Route::get('/appointments/slots', [AppointmentController::class, 'slots']);

    // S12 — Indoor navigation (public)
    Route::get('/nav/map', [NavController::class, 'map']);
    Route::get('/nav/search', [NavController::class, 'search']);
    Route::get('/nav/route', [NavController::class, 'route']);

    // These serve both guests and authenticated staff (the user is resolved when
    // a bearer token is present, but not required).
    Route::middleware('auth.optional')->group(function () {
        // Patient registration: a guest self-registers (gets a token); reception or
        // admin adds a patient on the desk (gets the patient back, keeps their session).
        Route::post('/patients/register', [AuthController::class, 'register']);
        Route::post('/admin/import', [ImportController::class, 'upload']);
        Route::post('/admin/import/seed', [ImportController::class, 'seed']);
        // Guests or patients may request an appointment.
        Route::post('/appointments', [AppointmentController::class, 'store']);
    });

    /* ---------------------------------------------------------------------
     | Authenticated
     * --------------------------------------------------------------------*/
    Route::middleware('auth:sanctum')->group(function () {

        // S1 — Identity
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        // Per-user actions (mobile / Apple Watch shortcuts) — scoped to the token user
        Route::get('/me/actions', [UserActionController::class, 'index']);
        Route::get('/me/actions/active', [UserActionController::class, 'active']);
        Route::delete('/me/actions/active', [UserActionController::class, 'clearActive']);
        Route::post('/me/actions', [UserActionController::class, 'store']);
        Route::post('/me/actions/{id}/activate', [UserActionController::class, 'activate'])->whereNumber('id');
        Route::put('/me/actions/{id}', [UserActionController::class, 'update'])->whereNumber('id');
        Route::delete('/me/actions/{id}', [UserActionController::class, 'destroy'])->whereNumber('id');

        Route::get('/patients', [PatientController::class, 'index'])->middleware('role:staff');
        Route::get('/patients/{serial}', [PatientController::class, 'show']);
        Route::put('/patients/{serial}/preferences', [PatientController::class, 'updatePreferences']);
        Route::post('/patients/{serial}/cards', [PatientController::class, 'issueCard'])->middleware('role:reception,admin');
        Route::post('/patients/{serial}/qr', [PatientController::class, 'issueQr'])->middleware('role:reception,admin');
        Route::get('/patients/{serial}/accessibility', [PatientController::class, 'accessibility']);
        Route::put('/patients/{serial}/accessibility', [PatientController::class, 'updateAccessibility']);

        // S2 — Appointments
        Route::get('/appointments', [AppointmentController::class, 'index']);
        Route::patch('/appointments/{id}/reschedule', [AppointmentController::class, 'reschedule']);
        Route::delete('/appointments/{id}', [AppointmentController::class, 'destroy']);
        Route::patch('/appointments/{id}/status', [AppointmentController::class, 'setStatus'])->middleware('role:reception,admin');
        Route::post('/appointments/{id}/assign', [AppointmentController::class, 'assign'])->middleware('role:reception,director,admin');

        // S3 — Patient journey
        Route::post('/visits', [VisitController::class, 'store'])->middleware('role:reception,admin');
        Route::get('/visits', [VisitController::class, 'index']);
        Route::get('/visits/{id}', [VisitController::class, 'show']);
        Route::post('/visits/{id}/triage', [VisitController::class, 'triage'])->middleware('role:nurse,admin');
        Route::post('/visits/{id}/advance', [VisitController::class, 'advance'])->middleware('role:doctor,nurse,admin');
        Route::post('/visits/{id}/cath-type', [VisitController::class, 'cathType'])->middleware('role:doctor,admin');
        Route::get('/visits/{id}/care-plan', [VisitController::class, 'showCarePlan']);
        Route::post('/visits/{id}/care-plan', [VisitController::class, 'storeCarePlan'])->middleware('role:doctor,admin');
        Route::post('/visits/{id}/consents', [ConsentController::class, 'store'])->middleware('role:doctor,nurse,admin');
        Route::post('/consents/{id}/respond', [ConsentController::class, 'respond']);
        Route::post('/visits/{id}/checklists', [ConsentController::class, 'checklist'])->middleware('role:nurse,admin');
        Route::post('/visits/{id}/transport', [TransportController::class, 'store'])->middleware('role:nurse,admin');
        Route::post('/visits/{id}/committee', [CommitteeController::class, 'store'])->middleware('role:doctor,reception,admin');
        Route::post('/committee/{id}/authorize', [CommitteeController::class, 'authorize'])->middleware('role:doctor,director,reception,admin');

        // S4 — Vitals & early warning
        Route::post('/visits/{id}/vitals', [VitalsController::class, 'store'])->middleware('role:nurse,doctor,admin');
        Route::get('/visits/{id}/vitals', [VitalsController::class, 'index']);
        Route::get('/visits/{id}/risk-score', [VitalsController::class, 'riskScore'])->middleware('role:staff');
        Route::post('/visits/{id}/risk-score/recompute', [VitalsController::class, 'recompute'])->middleware('role:doctor,nurse,admin');
        Route::post('/visits/{id}/vte', [VitalsController::class, 'vte'])->middleware('role:doctor,admin');
        Route::put('/visits/{id}/thresholds', [VitalsController::class, 'thresholds'])->middleware('role:doctor,admin');

        // S5 — Medication, diagnostics & records
        Route::post('/visits/{id}/prescriptions', [MedicationController::class, 'store'])->middleware('role:doctor,admin');
        Route::get('/visits/{id}/prescriptions', [MedicationController::class, 'index']);
        Route::post('/prescriptions/{id}/administer', [MedicationController::class, 'administer']);
        Route::post('/visits/{id}/reconciliation', [MedicationController::class, 'reconciliation'])->middleware('role:doctor,nurse,admin');
        Route::get('/pharmacy/availability', [MedicationController::class, 'pharmacyAvailability'])->middleware('role:staff');
        Route::post('/visits/{id}/orders', [DiagnosticsController::class, 'storeOrder'])->middleware('role:doctor,admin');
        Route::get('/visits/{id}/orders', [DiagnosticsController::class, 'indexOrders'])->middleware('role:staff');
        Route::post('/orders/{id}/result', [DiagnosticsController::class, 'fileResult'])->middleware('role:doctor,nurse,admin');
        Route::get('/visits/{id}/results', [DiagnosticsController::class, 'results']);
        Route::post('/visits/{id}/diagnosis', [DiagnosticsController::class, 'storeDiagnosis'])->middleware('role:doctor,admin');
        Route::get('/patients/{serial}/file', [DiagnosticsController::class, 'patientFile']);
        Route::post('/visits/{id}/consultations', [DiagnosticsController::class, 'storeConsultation'])->middleware('role:doctor,admin');

        // S6 — AI assistant & documentation
        Route::post('/assistant/ask', [AssistantController::class, 'ask']);
        Route::post('/assistant/triage', [AssistantController::class, 'triage']);
        Route::post('/documentation/draft', [AssistantController::class, 'draft'])->middleware('role:doctor,nurse,admin');
        Route::post('/documentation/{draftId}/approve', [AssistantController::class, 'approve'])->middleware('role:doctor,admin');
        Route::post('/documentation/transcribe', [AssistantController::class, 'transcribe'])->middleware('role:staff');
        Route::post('/documentation/translate', [AssistantController::class, 'translate']);

        // S7 — Emergency & notifications
        Route::post('/emergency/sos', [EmergencyController::class, 'sos'])->middleware('role:patient,family');
        Route::post('/emergency/code-blue', [EmergencyController::class, 'codeBlue'])->middleware('role:nurse,emergency,admin');
        Route::get('/emergency/active', [EmergencyController::class, 'active'])->middleware('role:emergency,nurse,doctor,admin');
        Route::post('/emergency/{id}/answer', [EmergencyController::class, 'answer'])->middleware('role:emergency,nurse,admin');
        Route::post('/emergency/{id}/advance', [EmergencyController::class, 'advance'])->middleware('role:emergency,nurse,admin');
        Route::get('/emergency/metrics', [EmergencyController::class, 'metrics'])->middleware('role:emergency,director,admin');
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);

        // S8 — Family & caregiver
        Route::post('/patients/{serial}/family', [FamilyController::class, 'store']);
        Route::get('/patients/{serial}/family', [FamilyController::class, 'index']);
        Route::post('/family/{id}/accept', [FamilyController::class, 'accept'])->middleware('role:family,patient');
        Route::patch('/family/{id}/permissions', [FamilyController::class, 'permissions']);
        Route::delete('/family/{id}', [FamilyController::class, 'destroy']);

        // S9 — Billing & insurance
        Route::get('/patients/{serial}/insurance', [BillingController::class, 'showInsurance']);
        Route::patch('/patients/{serial}/insurance', [BillingController::class, 'updateInsurance'])->middleware('role:reception,admin');
        Route::post('/visits/{id}/billing/committee-review', [BillingController::class, 'committeeReview'])->middleware('role:reception,admin');
        Route::get('/visits/{id}/financial-file', [BillingController::class, 'financialFile']);
        Route::post('/visits/{id}/payments', [BillingController::class, 'pay']);

        // S10 — Feedback & quality
        Route::post('/stages/{id}/feedback', [QualityController::class, 'rateStage'])->middleware('role:patient,family');
        Route::post('/complaints', [QualityController::class, 'storeComplaint']);
        Route::get('/complaints', [QualityController::class, 'indexComplaints'])->middleware('role:quality,director,admin');
        Route::patch('/complaints/{id}', [QualityController::class, 'updateComplaint'])->middleware('role:quality,admin');
        Route::get('/feedback', [QualityController::class, 'indexFeedback'])->middleware('role:quality,director,admin');
        Route::get('/quality/dashboard', [QualityController::class, 'dashboard'])->middleware('role:quality,director,admin');

        // S10 — Patient suggestions & overall care rating (mobile app)
        Route::post('/suggestions', [SuggestionController::class, 'store'])->middleware('role:patient,family');
        Route::get('/suggestions', [SuggestionController::class, 'index']);
        Route::post('/ratings/overall', [RatingController::class, 'store'])->middleware('role:patient,family');
        Route::get('/ratings/overall', [RatingController::class, 'show'])->middleware('role:patient,family');

        // S11 — Education & loyalty
        Route::get('/education/videos', [EducationController::class, 'videos']);
        Route::get('/education/relax', [EducationController::class, 'relax']);
        Route::get('/patients/{serial}/care-points', [EducationController::class, 'carePoints']);

        // S12 — Admin, reporting
        Route::middleware('role:admin')->group(function () {
            Route::post('/admin/users', [AdminController::class, 'storeUser']);
            Route::get('/admin/users', [AdminController::class, 'indexUsers']);
            Route::patch('/admin/users/{id}/role', [AdminController::class, 'setRole']);
            Route::match(['get', 'put'], '/admin/permissions', [AdminController::class, 'permissions']);
            Route::get('/admin/audit', [AdminController::class, 'audit']);
            Route::get('/admin/integrations', [AdminController::class, 'integrations']);
            Route::get('/admin/ai-models', [AdminController::class, 'aiModels']);

            // S12 — Content management (admin edits everything on the site)
            Route::get('/admin/departments', [AdminContentController::class, 'departments']);
            Route::post('/admin/departments', [AdminContentController::class, 'storeDepartment']);
            Route::put('/admin/departments/{code}', [AdminContentController::class, 'updateDepartment']);
            Route::delete('/admin/departments/{code}', [AdminContentController::class, 'destroyDepartment']);

            Route::get('/admin/education', [AdminContentController::class, 'education']);
            Route::post('/admin/education', [AdminContentController::class, 'storeEducation']);
            Route::put('/admin/education/{id}', [AdminContentController::class, 'updateEducation']);
            Route::delete('/admin/education/{id}', [AdminContentController::class, 'destroyEducation']);

            Route::get('/admin/drugs', [AdminContentController::class, 'drugs']);
            Route::post('/admin/drugs', [AdminContentController::class, 'storeDrug']);
            Route::put('/admin/drugs/{id}', [AdminContentController::class, 'updateDrug']);
            Route::delete('/admin/drugs/{id}', [AdminContentController::class, 'destroyDrug']);

            Route::get('/admin/hospital', [AdminContentController::class, 'hospital']);
            Route::put('/admin/hospital', [AdminContentController::class, 'updateHospital']);

            Route::put('/admin/patients/{serial}', [AdminContentController::class, 'updatePatient']);
            Route::put('/admin/visits/{id}', [AdminContentController::class, 'updateVisit']);

            Route::post('/admin/media', [AdminContentController::class, 'uploadMedia']);
        });
        Route::get('/reports/kpis', [ReportController::class, 'kpis'])->middleware('role:director,quality,admin');
        Route::get('/reports/monthly', [ReportController::class, 'monthly'])->middleware('role:director,quality,admin');
    });
});
