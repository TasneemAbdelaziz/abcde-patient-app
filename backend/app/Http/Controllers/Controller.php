<?php

namespace App\Http\Controllers;

use App\Http\Traits\ApiResponds;
use App\Http\Traits\AuthorizesPatientAccess;

/**
 * Base controller. Cross-cutting concerns shared by every endpoint live in
 * traits: the JSON response envelope ({@see ApiResponds}) and patient-record
 * access rules ({@see AuthorizesPatientAccess}). Task-specific helpers
 * (visit resolution, audit writing) are pulled in per-controller.
 */
abstract class Controller
{
    use ApiResponds;
    use AuthorizesPatientAccess;
}
