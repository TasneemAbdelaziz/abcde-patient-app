<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserAction\StoreUserActionRequest;
use App\Http\Resources\UserActionResource;
use App\Models\UserAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Per-user actions (mobile / Apple Watch shortcuts). Each action is bound to an
 * app page/route. The watch "activates" one (POST /me/actions/{id}/activate),
 * and the mobile app reads the most-recently-activated action
 * (GET /me/actions/active) to navigate. Everything is scoped to the
 * authenticated user resolved from the Bearer token — one set per user.
 */
class UserActionController extends Controller
{
    private function scope(Request $request)
    {
        return UserAction::where('user_id', $request->user()->id);
    }

    /** id of the user's most-recently-activated action (or null). */
    private function activeId(Request $request): ?int
    {
        return $this->scope($request)->whereNotNull('last_activated_at')
            ->orderByDesc('last_activated_at')->orderByDesc('id')->value('id');
    }

    private function withActiveFlag($collection, ?int $activeId)
    {
        return $collection->map(function ($a) use ($activeId) {
            $a->is_active = $a->id === $activeId;
            return $a;
        });
    }

    /** GET /me/actions — list all of my actions. */
    public function index(Request $request): JsonResponse
    {
        $activeId = $this->activeId($request);
        $items = $this->scope($request)->orderBy('position')->orderBy('id')->get();

        return $this->ok(UserActionResource::collection($this->withActiveFlag($items, $activeId)));
    }

    /** GET /me/actions/active — the last action the user activated (for navigation). */
    public function active(Request $request): JsonResponse
    {
        $action = $this->scope($request)->whereNotNull('last_activated_at')
            ->orderByDesc('last_activated_at')->orderByDesc('id')->first();
        if ($action) {
            $action->is_active = true;
        }

        return $this->ok($action ? new UserActionResource($action) : null);
    }

    /** POST /me/actions — create an action bound to a page/route. */
    public function store(StoreUserActionRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;
        $action = UserAction::create($data);

        return $this->ok(new UserActionResource($action), 'Action created.', 201);
    }

    /** PUT /me/actions/{id} — update one of my actions. */
    public function update(StoreUserActionRequest $request, int $id): JsonResponse
    {
        $action = $this->scope($request)->findOrFail($id);
        $action->update($request->validated());

        return $this->ok(new UserActionResource($action->fresh()), 'Action updated.');
    }

    /** DELETE /me/actions/{id} — delete one of my actions. */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->scope($request)->findOrFail($id)->delete();

        return $this->ok(null, 'Action deleted.');
    }

    /** POST /me/actions/{id}/activate — mark this action as the last active one. */
    public function activate(Request $request, int $id): JsonResponse
    {
        $action = $this->scope($request)->findOrFail($id);
        $action->update(['last_activated_at' => now()]);
        $action->is_active = true;

        return $this->ok(new UserActionResource($action), 'Action activated.');
    }

    /** DELETE /me/actions/active — clear the active action. */
    public function clearActive(Request $request): JsonResponse
    {
        $this->scope($request)->update(['last_activated_at' => null]);

        return $this->ok(null, 'Active action cleared.');
    }
}
