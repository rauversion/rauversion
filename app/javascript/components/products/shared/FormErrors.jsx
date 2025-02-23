import React from 'react'

export default function FormErrors({ errors }) {
  if (!errors || Object.keys(errors).length === 0) return null

  // Convert React Hook Form errors to a simpler format
  const formattedErrors = Object.entries(errors).reduce((acc, [field, error]) => {
    // Handle React Hook Form error object
    if (error && typeof error === 'object' && 'message' in error) {
      acc[field] = error.message;
    } 
    // Handle backend error arrays
    else if (Array.isArray(error)) {
      acc[field] = error.join(', ');
    }
    // Handle string errors
    else if (typeof error === 'string') {
      acc[field] = error;
    }
    return acc;
  }, {});

  return (
    <div className="rounded-md bg-red-50 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            There were errors with your submission
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <ul className="list-disc pl-5 space-y-1">
              {Object.entries(formattedErrors).map(([field, message]) => (
                <li key={field}>
                  {field} {message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
