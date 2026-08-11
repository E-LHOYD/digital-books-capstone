// Shared facts about user documents.
//
// This list mirrors DEPARTMENTS in src/lib/users.js in the admin dashboard.
// Both sides must agree, or a teacher registered on one side has a department
// the other cannot filter on.

// What a teacher is attached to. Teachers have no year, course or student
// number, so this and an employee number are all that stands in for the
// academic credentials a student carries.
export const DEPARTMENTS = ['Senior High', 'College', 'Both'];
