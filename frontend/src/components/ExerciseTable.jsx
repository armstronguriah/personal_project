import {ui} from '../styles/ui';

function formatMovementPattern(pattern) {
    if (!pattern) return 'Not Assigned';

    return pattern
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ExerciseTable({
                                          exercises,
                                          onEdit,
                                          onDelete,
                                          onViewDetails,
                                          deletingId
                                      }) {
    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {/* Table Header */}
            <div
                className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-5 sm:px-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">
                        Exercise Library
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Browse and manage your exercise database.
                    </p>
                </div>

                <span className={ui.badge}>
          {exercises.length} Exercises
        </span>
            </div>

            {/* Empty State */}
            {exercises.length === 0 ? (
                <div className="px-6 py-12 text-center">
                    <h3 className="text-base font-semibold text-slate-900">
                        No Exercises Found
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                        Try adjusting your filters or adding an exercise.
                    </p>
                </div>
            ) : (

                /* Scrollable Table */
                <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-275 border-collapse text-left">

                        <thead className="bg-slate-50">
                        <tr>
                            <th scope="col" className={ui.tableHeader}>
                                Exercise Name
                            </th>

                            <th scope="col" className={ui.tableHeader}>
                                Primary Muscle
                            </th>

                            <th scope="col" className={ui.tableHeader}>
                                Equipment
                            </th>

                            <th scope="col" className={ui.tableHeader}>
                                Movement Pattern
                            </th>

                            <th scope="col" className={ui.tableHeader}>
                                Description
                            </th>

                            <th
                                scope="col"
                                className={`${ui.tableHeader} min-w-[260px] text-right`}
                            >
                                Actions
                            </th>
                        </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white">
                        {exercises.map((exercise) => {
                            return (
                                <tr
                                    key={exercise.id}
                                    className="transition-colors hover:bg-blue-50/50"
                                >

                                    {/* Exercise Name */}
                                    <td className="px-4 py-4 align-middle">
                      <span className="text-sm font-semibold text-slate-900">
                        {exercise.name}
                      </span>
                                    </td>

                                    {/* Primary Muscle */}
                                    <td className="px-4 py-4 align-middle">
                      <span className="text-sm text-slate-700">
                        {exercise.primaryMuscle}
                      </span>
                                    </td>

                                    {/* Equipment */}
                                    <td className="px-4 py-4 align-middle">
                      <span
                          className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {exercise.equipment}
                      </span>
                                    </td>

                                    {/* Movement Pattern */}
                                    <td className="px-4 py-4 align-middle">
                      <span className={ui.badge}>
                        {formatMovementPattern(
                            exercise.movementPattern
                        )}
                      </span>
                                    </td>

                                    {/* Description */}
                                    <td className="max-w-xs px-4 py-4 align-middle">
                                        <p className="text-sm leading-6 text-slate-500">
                                            {exercise.description ||
                                                'No description provided.'}
                                        </p>
                                    </td>


                                    {/* Actions */}

                                    {/* Actions */}
                                    <td className="whitespace-nowrap px-4 py-3 align-middle">
                                        <div className="flex flex-nowrap items-center justify-end gap-2">

                                            {/* View Details */}
                                            <button
                                                type="button"
                                                onClick={() => onViewDetails(exercise)}
                                                className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                                            >
                                                View Details
                                            </button>

                                            {/* Edit */}
                                            <button
                                                type="button"
                                                onClick={() => onEdit(exercise)}
                                                disabled={deletingId === exercise.id}
                                                className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Edit
                                            </button>

                                            {/* Delete */}
                                            <button
                                                type="button"
                                                onClick={() => onDelete(exercise.id)}
                                                disabled={deletingId === exercise.id}
                                                className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-red-200 bg-white px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {deletingId === exercise.id ? 'Deleting...' : 'Delete'}
                                            </button>

                                        </div>
                                    </td>


                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
