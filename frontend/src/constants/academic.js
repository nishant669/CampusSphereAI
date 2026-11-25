/**
 * Shared course & branch constants used across admin and professor pages.
 * Covers: B.Tech, M.Tech, BCA, MCA, MBA, Pharmacy, Nursing, B.Sc, B.Com
 */

export const COURSE_BRANCHES = {
  'B.Tech': ['CSE', 'ECE', 'ME', 'CE', 'EE', 'IT', 'AI & ML', 'CS & IT'],
  'M.Tech': ['CSE', 'ECE', 'ME', 'Structural Engg', 'VLSI', 'Power Systems'],
  'BCA':    ['General'],
  'MCA':    ['General', 'Cloud Computing', 'Data Science'],
  'MBA':    ['Finance', 'HR', 'Marketing', 'Operations', 'IT Management'],
  'B.Sc':  ['CS', 'IT', 'Physics', 'Chemistry', 'Mathematics', 'Biotechnology'],
  'B.Com': ['General', 'Accounting & Finance', 'Computer Applications'],
  'Pharmacy': ['General', 'Clinical Pharmacy', 'Pharmaceutical Chemistry'],
  'Nursing':  ['General', 'Paediatric Nursing', 'Community Health Nursing'],
};

/** Flat list of all courses */
export const ALL_COURSES = Object.keys(COURSE_BRANCHES);

/** Get branches for a given course */
export const getBranches = (course) => COURSE_BRANCHES[course] || [];

/** Flat list used for simple dropdowns */
export const ALL_BRANCHES = [
  'CSE', 'ECE', 'ME', 'CE', 'EE', 'IT', 'AI & ML', 'CS & IT',
  'Structural Engg', 'VLSI', 'Power Systems',
  'General', 'Cloud Computing', 'Data Science',
  'Finance', 'HR', 'Marketing', 'Operations', 'IT Management',
  'CS', 'Physics', 'Chemistry', 'Mathematics', 'Biotechnology',
  'Accounting & Finance', 'Computer Applications',
  'Clinical Pharmacy', 'Pharmaceutical Chemistry',
  'Paediatric Nursing', 'Community Health Nursing',
];

export const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export const EXAM_LABELS = {
  MST_1: 'MST 1', MST_2: 'MST 2', MST_3: 'MST 3',
  UNIT_TEST_1: 'Unit Test 1', UNIT_TEST_2: 'Unit Test 2', UNIT_TEST_3: 'Unit Test 3',
};
